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

  const allMemberIds = members.map((m) => m.user_id);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const syncedSelected = selectedMembers.length === 0 ? allMemberIds : selectedMembers;

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
      className="flex flex-col max-w-lg mx-auto"
      style={{ height: "calc(100dvh - 62px)" }}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-12 pb-3 flex flex-col gap-3">
        {/* Month navigation */}
        <div className="flex items-center gap-3">
          <motion.button
            onClick={prevMonth}
            disabled={!canGoPrev}
            whileTap={{ scale: 0.88 }}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors disabled:opacity-25"
            style={{ backgroundColor: "rgba(28,25,23,0.06)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7L9 3" stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>

          <h1 className="font-display text-[24px] font-[300] tracking-[-0.4px] text-ink text-center flex-1">
            {monthLabel}
          </h1>

          <motion.button
            onClick={nextMonth}
            disabled={!canGoNext}
            whileTap={{ scale: 0.88 }}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors disabled:opacity-25"
            style={{ backgroundColor: "rgba(28,25,23,0.06)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3L9 7L5 11" stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </div>

        {/* Member chips — group type only */}
        {!isCouple && memberList.length > 1 && (
          <MemberChipRow
            members={memberList}
            selected={syncedSelected}
            onToggle={toggleMember}
          />
        )}

        {/* Legend + hint */}
        <div className="flex items-center gap-4">
          {[
            { colour: "#DCF0E1", label: "Free" },
            { colour: "#F5EDDA", label: "Mixed" },
            { colour: "#F5DEDE", label: "Busy" },
          ].map(({ colour, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="rounded-[4px]"
                style={{ width: 11, height: 11, backgroundColor: colour, border: "0.5px solid rgba(28,25,23,0.10)" }}
              />
              <span className="text-[11px] text-ink3">{label}</span>
            </div>
          ))}
          <span className="text-[11px] text-ink3 ml-auto">Tap to toggle</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 px-4 pb-4 min-h-0">
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
