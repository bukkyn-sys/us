"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthContext } from "@/lib/context/AuthContext";
import { useGroup } from "@/lib/hooks/useGroup";
import { useCalendar } from "@/lib/hooks/useCalendar";
import { setAvailability, deleteAvailability } from "@/lib/db";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { MemberChipRow } from "@/components/calendar/MemberChipRow";

export default function CalendarPage() {
  const { user, profile } = useAuthContext();
  const groupId = profile?.active_group_id ?? null;
  const { group, members, memberProfiles } = useGroup(groupId);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const yearMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
  const { availability } = useCalendar(groupId, yearMonth);

  const isCouple = group?.type === "couple";
  const memberList = members.map((m) => ({
    user_id: m.user_id,
    profile: memberProfiles[m.user_id],
  }));

  const [selectedMembers, setSelectedMembers] = useState<string[]>(() =>
    members.map((m) => m.user_id)
  );

  // Keep selectedMembers in sync when members load
  const allMemberIds = members.map((m) => m.user_id);
  const syncedSelected = selectedMembers.length === 0 && allMemberIds.length > 0
    ? allMemberIds
    : selectedMembers;

  function toggleMember(uid: string) {
    setSelectedMembers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  }

  async function handleDayPress(dateStr: string) {
    if (!user || !groupId) return;
    const existing = availability.find(
      (a) => a.date === dateStr && a.user_id === user.id
    );

    if (!existing) {
      await setAvailability(groupId, user.id, dateStr, "free");
    } else if (existing.status === "free") {
      await setAvailability(groupId, user.id, dateStr, "busy");
    } else {
      await deleteAvailability(groupId, user.id, dateStr);
    }
  }

  const minYear = now.getFullYear();
  const minMonth = now.getMonth();
  const maxDate = new Date(now.getFullYear(), now.getMonth() + 12, 1);

  function prevMonth() {
    if (year === minYear && month === minMonth) return;
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    const next = new Date(year, month + 1, 1);
    if (next >= maxDate) return;
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const canGoPrev = !(year === minYear && month === minMonth);
  const canGoNext = new Date(year, month + 1, 1) < maxDate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex flex-col h-[calc(100vh-56px)] max-w-lg mx-auto"
    >
      {/* Header */}
      <div className="px-4 pt-12 pb-3 flex flex-col gap-3 flex-shrink-0">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            disabled={!canGoPrev}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] disabled:opacity-30"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="#2C2820" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-[15px] font-[500] text-ink">{monthLabel}</h1>
          <button
            onClick={nextMonth}
            disabled={!canGoNext}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] disabled:opacity-30"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="#2C2820" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Member chips — only for group type */}
        {!isCouple && memberList.length > 0 && (
          <MemberChipRow
            members={memberList}
            selected={syncedSelected}
            onToggle={toggleMember}
          />
        )}

        {/* Legend */}
        <div className="flex gap-3">
          {[
            { colour: "#E4F0E7", label: "Free" },
            { colour: "#FAF0DC", label: "Partial" },
            { colour: "#FAE8E7", label: "Busy" },
          ].map(({ colour, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: colour, border: "0.5px solid rgba(44,40,32,0.10)" }} />
              <span className="text-[11px] text-ink3">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-green" />
            <span className="text-[11px] text-ink3">You&apos;re free</span>
          </div>
        </div>
      </div>

      {/* Calendar grid — fills remaining space */}
      <div className="flex-1 px-4 pb-4 overflow-hidden">
        <CalendarGrid
          year={year}
          month={month}
          availability={availability}
          selectedMembers={isCouple ? allMemberIds : syncedSelected}
          userId={user?.id ?? ""}
          onDayPress={handleDayPress}
        />
      </div>
    </motion.div>
  );
}
