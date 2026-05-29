"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addExpense, type UserRow } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

interface SplitModalProps {
  groupId: string;
  userId: string;
  members: { user_id: string; profile?: UserRow | null }[];
  onClose: () => void;
}

export function SplitModal({ groupId, userId, members, onClose }: SplitModalProps) {
  const [title, setTitle] = useState("");
  const [total, setTotal] = useState("");
  const [paidBy, setPaidBy] = useState(userId);
  const [selectedMembers, setSelectedMembers] = useState(members.map((m) => m.user_id));
  const [percentages, setPercentages] = useState<Record<string, string>>(() => {
    const pct: Record<string, string> = {};
    members.forEach((m) => { pct[m.user_id] = ""; });
    return pct;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totalNum = parseFloat(total) || 0;

  function equalSplit() {
    if (selectedMembers.length === 0) return;
    const pct = (100 / selectedMembers.length).toFixed(1);
    const updated: Record<string, string> = {};
    members.forEach((m) => { updated[m.user_id] = selectedMembers.includes(m.user_id) ? pct : ""; });
    setPercentages(updated);
  }

  function toggleMember(uid: string) {
    setSelectedMembers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  }

  function pctTotal() {
    return selectedMembers.reduce((acc, uid) => acc + (parseFloat(percentages[uid]) || 0), 0);
  }

  async function handleSave() {
    setError("");
    if (!title.trim() || !total || totalNum <= 0) { setError("Fill in title and amount."); return; }
    if (selectedMembers.length === 0) { setError("Select at least one person."); return; }
    const sum = pctTotal();
    if (Math.abs(sum - 100) > 0.1) { setError(`Percentages must total 100% (currently ${sum.toFixed(1)}%).`); return; }

    setSaving(true);
    const splits = selectedMembers.map((uid) => ({
      user_id: uid,
      pct: parseFloat(percentages[uid]) || 0,
      amount: parseFloat(((parseFloat(percentages[uid]) / 100) * totalNum).toFixed(2)),
    }));
    await addExpense({
      group_id: groupId,
      title: title.trim(),
      total: totalNum,
      paid_by: paidBy,
      splits,
      date: new Date().toISOString().slice(0, 10),
      created_by: userId,
    });
    setSaving(false);
    onClose();
  }

  const pctSum = pctTotal();
  const pctOk = Math.abs(pctSum - 100) <= 0.1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 bg-ink/40 z-50 flex items-end"
        style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
          className="w-full bg-card rounded-t-[24px] flex flex-col"
          style={{
            maxHeight: "92vh",
            paddingBottom: "calc(28px + env(safe-area-inset-bottom, 0px))",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "rgba(28,25,23,0.15)" }} />
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex flex-col gap-5 px-5 pt-3 pb-2">
            <div className="flex items-center justify-between flex-shrink-0">
              <h3 className="text-[18px] font-[500] text-ink">Add expense</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(28,25,23,0.06)" }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3L11 11M11 3L3 11" stroke="#AAA49E" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Title + Amount */}
            <div className="flex gap-2.5">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What for?"
                autoFocus
                className="flex-1 bg-cream2 rounded-[10px] px-3 py-3 text-[14px] text-ink placeholder:text-ink3 border border-[rgba(28,25,23,0.08)] outline-none focus:border-accent transition-colors"
              />
              <div className="relative w-28">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-ink3">£</span>
                <input
                  type="number"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full bg-cream2 rounded-[10px] pl-7 pr-3 py-3 text-[14px] text-ink border border-[rgba(28,25,23,0.08)] outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            {/* Paid by */}
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-[500] text-ink2">Paid by</label>
              <div className="flex gap-2 flex-wrap">
                {members.map((m) => (
                  <button
                    key={m.user_id}
                    onClick={() => setPaidBy(m.user_id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full transition-colors"
                    style={{
                      backgroundColor: paidBy === m.user_id ? "#1C1917" : "rgba(28,25,23,0.07)",
                    }}
                  >
                    <Avatar src={m.profile?.photo_url} name={m.profile?.display_name || "?"} accentColour={m.profile?.accent_colour} size={20} />
                    <span className="text-[12px] font-[500]" style={{ color: paidBy === m.user_id ? "#F5F0EA" : "#6B6460" }}>
                      {m.user_id === userId ? "You" : (m.profile?.display_name?.split(" ")[0] || "?")}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Split between */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-[500] text-ink2">Split between</label>
                <button
                  onClick={equalSplit}
                  className="text-[12px] font-[500] text-accent active:opacity-60 transition-opacity"
                >
                  Equal split
                </button>
              </div>
              {members.map((m) => {
                const active = selectedMembers.includes(m.user_id);
                return (
                  <div key={m.user_id} className="flex items-center gap-3">
                    <button onClick={() => toggleMember(m.user_id)}>
                      <div
                        className="w-5 h-5 rounded-[5px] flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: active ? "#1C1917" : "transparent",
                          border: active ? "none" : "1px solid rgba(28,25,23,0.25)",
                        }}
                      >
                        {active && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5L4.5 7.5L8 3" stroke="#F5F0EA" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </button>
                    <Avatar src={m.profile?.photo_url} name={m.profile?.display_name || "?"} accentColour={m.profile?.accent_colour} size={26} />
                    <span className="flex-1 text-[13px] text-ink">
                      {m.user_id === userId ? "You" : (m.profile?.display_name?.split(" ")[0] || "?")}
                    </span>
                    {active && (
                      <>
                        <div className="relative w-[68px]">
                          <input
                            type="number"
                            value={percentages[m.user_id]}
                            onChange={(e) => setPercentages((p) => ({ ...p, [m.user_id]: e.target.value }))}
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-full bg-cream2 rounded-[8px] px-2 py-1.5 text-[13px] text-ink text-right border border-[rgba(28,25,23,0.08)] outline-none pr-5"
                          />
                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px] text-ink3">%</span>
                        </div>
                        <span className="text-[12px] text-ink2 w-14 text-right tabular-nums">
                          £{((parseFloat(percentages[m.user_id]) || 0) / 100 * totalNum).toFixed(2)}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
              <div className="flex justify-end">
                <span
                  className="text-[11px] font-[500] px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: pctOk ? "#E6F5EE" : "#FDECEA",
                    color: pctOk ? "#3A7A50" : "#A84040",
                  }}
                >
                  {pctSum.toFixed(1)}% / 100%
                </span>
              </div>
            </div>

            {error && (
              <p className="text-[13px] text-[#C04843] rounded-[8px] bg-[#FDECEA] px-3 py-2">{error}</p>
            )}

            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Add expense"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
