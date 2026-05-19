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
}

export function MoodCheckin({ groupId, userId, members }: MoodCheckinProps) {
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
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3 mb-2">
          How are you feeling?
        </p>
        <div className="flex gap-2 justify-between">
          {EMOJIS.map((emoji, i) => (
            <motion.button
              key={i}
              onClick={() => handleTap(i)}
              whileTap={{ scale: 1.3 }}
              transition={{ duration: 0.14 }}
              className={`flex-1 h-10 rounded-[8px] flex items-center justify-center text-[20px] transition-colors ${
                myMood === i ? "bg-accent-light" : "bg-cream2 active:bg-cream3"
              }`}
            >
              <span style={{ opacity: myMood !== null && myMood !== i ? 0.4 : 1 }}>
                {emoji}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {otherMembers.length > 0 && (
        <div className="flex flex-col gap-2">
          {otherMembers.map((m) => {
            const checkin = checkins.find((c) => c.user_id === m.user_id);
            const mood = checkin?.emoji_index ?? null;
            return (
              <div key={m.user_id} className="flex items-center gap-3">
                <Avatar
                  src={m.profile?.photo_url}
                  name={m.profile?.display_name || "?"}
                  accentColour={m.profile?.accent_colour}
                  size={28}
                />
                <span className="text-[13px] text-ink2 flex-1">
                  {m.profile?.display_name?.split(" ")[0] || "Them"}
                </span>
                <span
                  className="text-[20px]"
                  style={{ opacity: mood === null ? 0.3 : 1 }}
                >
                  {mood !== null ? EMOJIS[mood] : "?"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
