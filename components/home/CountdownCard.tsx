"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeCountdowns, addCountdown, archiveCountdown, type CountdownRow } from "@/lib/db";
import { daysUntil } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface CountdownCardProps {
  groupId: string;
  userId: string;
}

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

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">Countdowns</p>
        <button onClick={() => setAdding(true)} className="text-[12px] text-accent font-[500]">
          + Add
        </button>
      </div>

      {countdowns.length === 0 && !adding && (
        <p className="text-[13px] text-ink3 py-2">No countdowns yet.</p>
      )}

      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {countdowns.map((c) => {
            const days = daysUntil(c.date);
            const isPast = days < 0;
            const isToday = days === 0;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: isPast ? 0.45 : 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex items-center gap-3 bg-card rounded-[8px] px-3 py-2.5 border-[0.5px] border-[rgba(44,40,32,0.07)]"
              >
                <span className="text-[18px]">{c.emoji}</span>
                <span className="flex-1 text-[13px] text-ink truncate">{c.title}</span>
                <span
                  className="text-[12px] font-[500] whitespace-nowrap"
                  style={{ color: isToday ? "#6A9E7A" : isPast ? "#9E9488" : "#2C2820" }}
                >
                  {isToday ? "Today!" : isPast ? `${Math.abs(days)}d ago` : `${days}d`}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="bg-card rounded-[14px] border-[0.5px] border-[rgba(44,40,32,0.07)] p-4 flex flex-col gap-3"
          >
            <p className="text-[13px] font-[500] text-ink">New countdown</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-12 text-center bg-cream2 rounded-[8px] text-[20px] border-[0.5px] border-[rgba(44,40,32,0.12)]"
                maxLength={2}
              />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event name"
                className="flex-1 bg-cream2 rounded-[8px] px-3 py-2 text-[13px] text-ink placeholder:text-ink3 border-[0.5px] border-[rgba(44,40,32,0.12)]"
                maxLength={60}
              />
            </div>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-cream2 rounded-[8px] px-3 py-2 text-[13px] text-ink border-[0.5px] border-[rgba(44,40,32,0.12)]"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!title.trim() || !date || saving}>
                {saving ? "Adding…" : "Add"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
