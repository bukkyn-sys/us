"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeCountdowns, addCountdown, archiveCountdown, type CountdownRow } from "@/lib/db";
import { daysUntil } from "@/lib/utils";

interface CountdownCardProps {
  groupId: string;
  userId: string;
}

const today = new Date().toISOString().slice(0, 10);

export function CountdownCard({ groupId, userId }: CountdownCardProps) {
  const [countdowns, setCountdowns] = useState<CountdownRow[]>([]);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [emoji, setEmoji] = useState("🎉");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return subscribeCountdowns(groupId, (items) => {
      items.forEach((item) => {
        if (daysUntil(item.date) < -3) archiveCountdown(item.id);
      });
      const sorted = items
        .filter((i) => daysUntil(i.date) >= -3)
        .sort((a, b) => {
          const da = daysUntil(a.date);
          const db_ = daysUntil(b.date);
          if (da >= 0 && db_ >= 0) return da - db_;
          if (da < 0 && db_ < 0) return db_ - da;
          return da >= 0 ? -1 : 1;
        })
        .slice(0, 6);
      setCountdowns(sorted);
    });
  }, [groupId]);

  async function handleAdd() {
    if (!title.trim() || !date) return;
    setSaving(true);
    await addCountdown({ group_id: groupId, title: title.trim(), date, emoji, created_by: userId });
    setSaving(false);
    setAdding(false);
    setTitle("");
    setDate("");
    setEmoji("🎉");
  }

  return (
    <div className="bg-card rounded-[18px] shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[rgba(28,25,23,0.05)]">
        <p className="text-[11px] font-[600] uppercase tracking-[0.08em] text-ink3">Upcoming</p>
        <motion.button
          onClick={() => setAdding((v) => !v)}
          whileTap={{ scale: 0.92 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-[500] transition-colors"
          style={{
            backgroundColor: adding ? "rgba(28,25,23,0.06)" : "#C06B32",
            color: adding ? "#1C1917" : "#FFFFFF",
          }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>{adding ? "×" : "+"}</span>
          {adding ? "Cancel" : "Add"}
        </motion.button>
      </div>

      <div className="px-5 py-4 flex flex-col gap-2">
        {/* Empty state */}
        {countdowns.length === 0 && !adding && (
          <div className="py-6 flex flex-col items-center gap-2">
            <span className="text-[32px]">📅</span>
            <p className="text-[13px] text-ink3 text-center">No events yet — add your first countdown.</p>
          </div>
        )}

        {/* Countdown list */}
        <AnimatePresence initial={false}>
          {countdowns.map((c) => {
            const days = daysUntil(c.date);
            const isPast = days < 0;
            const isToday = days === 0;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: isPast ? 0.4 : 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex items-center gap-3 rounded-[12px] px-3 py-3"
                style={{ backgroundColor: isToday ? "#FBF0E6" : "rgba(28,25,23,0.04)" }}
              >
                <span className="text-[20px] leading-none">{c.emoji}</span>
                <span className="flex-1 text-[14px] text-ink truncate font-[400]">{c.title}</span>
                <span
                  className="text-[13px] font-[600] whitespace-nowrap tabular-nums"
                  style={{
                    color: isToday ? "#C06B32" : isPast ? "#AAA49E" : "#1C1917",
                  }}
                >
                  {isToday ? "Today!" : isPast ? `${Math.abs(days)}d ago` : `${days}d`}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add form */}
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="rounded-[14px] p-4 flex flex-col gap-3 mt-1"
              style={{ backgroundColor: "rgba(28,25,23,0.04)", border: "1px solid rgba(28,25,23,0.07)" }}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-12 text-center bg-card rounded-[8px] text-[20px] border border-[rgba(28,25,23,0.10)] outline-none"
                  maxLength={2}
                />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Event name"
                  autoFocus
                  className="flex-1 bg-card rounded-[8px] px-3 py-2 text-[14px] text-ink placeholder:text-ink3 border border-[rgba(28,25,23,0.10)] outline-none focus:border-accent transition-colors"
                  maxLength={60}
                />
              </div>
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-card rounded-[8px] px-3 py-2.5 text-[14px] text-ink border border-[rgba(28,25,23,0.10)] outline-none focus:border-accent transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setAdding(false)}
                  className="flex-1 bg-card text-ink border border-[rgba(28,25,23,0.10)] rounded-[12px] py-[12px] text-[14px] font-[500] active:opacity-60 transition-opacity"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!title.trim() || !date || saving}
                  className="flex-1 bg-accent text-white rounded-[12px] py-[12px] text-[14px] font-[500] disabled:opacity-40 active:opacity-80 transition-opacity"
                >
                  {saving ? "Adding…" : "Add"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
