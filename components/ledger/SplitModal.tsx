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
    if (!title.trim() || !total || totalNum <= 0) { setError("Please fill in title and amount."); return; }
    if (selectedMembers.length === 0) { setError("Select at least one member."); return; }
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink/30 z-50 flex items-end"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="w-full bg-card rounded-t-[20px] px-5 pt-5 flex flex-col gap-4"
          style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-[500] text-ink">Add expense</h3>
            <button onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 4L14 14M14 4L4 14" stroke="#9E9488" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What for?"
              className="flex-1 bg-cream2 rounded-[8px] px-3 py-2.5 text-[13px] text-ink placeholder:text-ink3 border-[0.5px] border-[rgba(44,40,32,0.12)]"
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-ink2">£</span>
              <input
                type="number"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-24 bg-cream2 rounded-[8px] pl-6 pr-3 py-2.5 text-[13px] text-ink placeholder:text-ink3 border-[0.5px] border-[rgba(44,40,32,0.12)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">Paid by</label>
            <div className="flex gap-2 flex-wrap">
              {members.map((m) => (
                <button
                  key={m.user_id}
                  onClick={() => setPaidBy(m.user_id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[20px] border-[0.5px] transition-colors ${
                    paidBy === m.user_id ? "bg-ink text-cream border-ink" : "bg-cream2 text-ink2 border-[rgba(44,40,32,0.12)]"
                  }`}
                >
                  <Avatar src={m.profile?.photo_url} name={m.profile?.display_name || "?"} accentColour={m.profile?.accent_colour} size={18} />
                  <span className="text-[12px] font-[500]">{m.profile?.display_name?.split(" ")[0] || "?"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">Split between</label>
              <button onClick={equalSplit} className="text-[11px] text-accent font-[500]">Equal split</button>
            </div>
            {members.map((m) => {
              const active = selectedMembers.includes(m.user_id);
              return (
                <div key={m.user_id} className="flex items-center gap-3">
                  <button onClick={() => toggleMember(m.user_id)}>
                    <div className={`w-5 h-5 rounded-[5px] border-[0.5px] flex items-center justify-center transition-colors ${active ? "bg-ink border-ink" : "border-[rgba(44,40,32,0.20)] bg-transparent"}`}>
                      {active && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.5 7.5L8 3" stroke="#F5F0E8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                  </button>
                  <Avatar src={m.profile?.photo_url} name={m.profile?.display_name || "?"} accentColour={m.profile?.accent_colour} size={24} />
                  <span className="flex-1 text-[13px] text-ink">{m.profile?.display_name?.split(" ")[0] || "?"}</span>
                  {active && (
                    <>
                      <div className="relative w-16">
                        <input
                          type="number"
                          value={percentages[m.user_id]}
                          onChange={(e) => setPercentages((p) => ({ ...p, [m.user_id]: e.target.value }))}
                          min="0"
                          max="100"
                          step="0.1"
                          className="w-full bg-cream2 rounded-[6px] px-2 py-1.5 text-[12px] text-ink text-right border-[0.5px] border-[rgba(44,40,32,0.12)] pr-5"
                        />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px] text-ink3">%</span>
                      </div>
                      <span className="text-[12px] text-ink2 w-14 text-right">
                        £{((parseFloat(percentages[m.user_id]) || 0) / 100 * totalNum).toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
            <div className="flex justify-end">
              <span className={`text-[11px] font-[500] ${Math.abs(pctTotal() - 100) > 0.1 ? "text-red" : "text-green"}`}>
                {pctTotal().toFixed(1)}% of 100%
              </span>
            </div>
          </div>

          {error && <p className="text-[13px] text-red">{error}</p>}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Add expense"}
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
