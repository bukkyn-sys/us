"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  subscribeMoodCheckins,
  setMoodCheckin,
  deleteMoodCheckin,
  type MoodCheckinRow,
  type UserRow,
} from "@/lib/db";
import { Avatar } from "@/components/ui/Avatar";

const EMOJIS = ["😔", "😕", "😐", "🙂", "😊"];
const MOOD_LABELS = ["Rough", "Meh", "Okay", "Good", "Great"];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

interface MoodCheckinProps {
  groupId: string;
  userId: string;
  members: { user_id: string; profile?: UserRow | null }[];
  inviteCode?: string;
}

export function MoodCheckin({ groupId, userId, members, inviteCode }: MoodCheckinProps) {
  const [checkins, setCheckins] = useState<MoodCheckinRow[]>([]);
  const [saving, setSaving] = useState(false);
  const date = todayDate();

  useEffect(() => {
    return subscribeMoodCheckins(groupId, date, setCheckins);
  }, [groupId, date]);

  const myCheckin = checkins.find((c) => c.user_id === userId);
  const myMood = myCheckin?.emoji_index ?? null;
  const otherMembers = members.filter((m) => m.user_id !== userId);

  async function handleTap(index: number) {
    if (saving) return;
    setSaving(true);
    try {
      if (myMood === index) {
        await deleteMoodCheckin(groupId, userId, date);
      } else {
        await setMoodCheckin(groupId, userId, date, index);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="bg-card rounded-[18px] shadow-card overflow-hidden"
    >
      {/* Header strip */}
      <div className="px-5 pt-4 pb-3 border-b border-[rgba(28,25,23,0.05)]">
        <p className="text-[11px] font-[600] uppercase tracking-[0.08em] text-ink3">
          How are you feeling?
        </p>
        {myMood !== null && (
          <p className="text-[12px] text-ink2 mt-0.5">{MOOD_LABELS[myMood]} today</p>
        )}
      </div>

      {/* Emoji row */}
      <div className="px-4 py-4 flex gap-2">
        {EMOJIS.map((emoji, i) => (
          <motion.button
            key={i}
            onClick={() => handleTap(i)}
            whileTap={{ scale: 1.2 }}
            transition={{ duration: 0.1 }}
            className="flex-1 flex flex-col items-center justify-center rounded-[12px] gap-1 transition-all"
            style={{
              height: 58,
              backgroundColor: myMood === i ? "#FBF0E6" : "rgba(28,25,23,0.04)",
              border: myMood === i ? "1.5px solid rgba(192,107,50,0.30)" : "1.5px solid transparent",
              opacity: saving ? 0.5 : myMood !== null && myMood !== i ? 0.4 : 1,
            }}
          >
            <span className="text-[22px] leading-none select-none">{emoji}</span>
          </motion.button>
        ))}
      </div>

      {/* Others or invite */}
      {otherMembers.length > 0 ? (
        <div className="px-5 pb-4 pt-1 flex flex-col gap-3 border-t border-[rgba(28,25,23,0.05)]">
          {otherMembers.map((m) => {
            const checkin = checkins.find((c) => c.user_id === m.user_id);
            const mood = checkin?.emoji_index ?? null;
            return (
              <div key={m.user_id} className="flex items-center gap-3">
                <Avatar
                  src={m.profile?.photo_url}
                  name={m.profile?.display_name || "?"}
                  accentColour={m.profile?.accent_colour}
                  size={32}
                />
                <div className="flex-1">
                  <p className="text-[13px] font-[500] text-ink leading-none">
                    {m.profile?.display_name?.split(" ")[0] || "Them"}
                  </p>
                  <p className="text-[11px] text-ink3 mt-0.5">
                    {mood !== null ? MOOD_LABELS[mood] : "Hasn't checked in"}
                  </p>
                </div>
                <span
                  className="text-[24px] leading-none"
                  style={{ opacity: mood === null ? 0.2 : 1 }}
                >
                  {mood !== null ? EMOJIS[mood] : "·"}
                </span>
              </div>
            );
          })}
        </div>
      ) : inviteCode ? (
        <div
          className="mx-4 mb-4 rounded-[12px] px-4 py-3 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #FBF0E6 0%, #F5E8D5 100%)" }}
        >
          <div>
            <p className="text-[12px] font-[600] text-ink">Invite your partner</p>
            <p className="text-[11px] text-ink3 mt-0.5">Share this code</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[20px] font-[600] tracking-[0.22em] text-ink">{inviteCode}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
