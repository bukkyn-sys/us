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

  const otherMembers = members.filter((m) => m.user_id !== userId);

  return (
    <div className="flex flex-col gap-4">
      {/* Label */}
      <p className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">
        How are you feeling?
      </p>

      {/* Emoji selector */}
      <div className="flex gap-2">
        {EMOJIS.map((emoji, i) => (
          <motion.button
            key={i}
            onClick={() => handleTap(i)}
            whileTap={{ scale: 1.25 }}
            transition={{ duration: 0.12 }}
            className="flex-1 flex items-center justify-center rounded-[10px] transition-colors"
            style={{
              height: 48,
              backgroundColor: myMood === i ? "#EDE0CC" : "rgba(44,40,32,0.05)",
              opacity: saving ? 0.6 : myMood !== null && myMood !== i ? 0.45 : 1,
            }}
          >
            <span className="text-[22px] leading-none select-none">{emoji}</span>
          </motion.button>
        ))}
      </div>

      {/* Others' moods or invite prompt */}
      {otherMembers.length > 0 ? (
        <div className="flex flex-col gap-2.5 pt-0.5">
          {otherMembers.map((m) => {
            const checkin = checkins.find((c) => c.user_id === m.user_id);
            const mood = checkin?.emoji_index ?? null;
            return (
              <div key={m.user_id} className="flex items-center gap-3">
                <Avatar
                  src={m.profile?.photo_url}
                  name={m.profile?.display_name || "?"}
                  accentColour={m.profile?.accent_colour}
                  size={30}
                />
                <span className="text-[13px] text-ink2 flex-1">
                  {m.profile?.display_name?.split(" ")[0] || "Them"}
                </span>
                <span
                  className="text-[22px] leading-none"
                  style={{ opacity: mood === null ? 0.25 : 1 }}
                >
                  {mood !== null ? EMOJIS[mood] : "—"}
                </span>
              </div>
            );
          })}
        </div>
      ) : inviteCode ? (
        <div
          className="rounded-[10px] px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: "rgba(44,40,32,0.04)" }}
        >
          <div>
            <p className="text-[12px] font-[500] text-ink">Invite someone</p>
            <p className="text-[11px] text-ink3 mt-0.5">Share your group code</p>
          </div>
          <p className="text-[18px] font-[500] tracking-[0.25em] text-ink">{inviteCode}</p>
        </div>
      ) : null}
    </div>
  );
}
