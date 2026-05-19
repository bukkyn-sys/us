"use client";

import { useState, useEffect } from "react";
import {
  subscribePotContributions,
  addPotContribution,
  type SavingPotRow,
  type PotContributionRow,
  type UserRow,
} from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { AnimatePresence, motion } from "framer-motion";

interface PotCardProps {
  pot: SavingPotRow;
  userId: string;
  memberProfiles: Record<string, UserRow>;
}

export function PotCard({ pot, userId, memberProfiles }: PotCardProps) {
  const [contributions, setContributions] = useState<PotContributionRow[]>([]);
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const canContribute = pot.contributors.includes(userId);

  useEffect(() => {
    return subscribePotContributions(pot.id, setContributions);
  }, [pot.id]);

  const total = contributions.reduce((acc, c) => acc + c.amount, 0);
  const progress = pot.goal_amount ? Math.min((total / pot.goal_amount) * 100, 100) : 0;

  async function handleAdd() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setSaving(true);
    await addPotContribution({
      pot_id: pot.id,
      user_id: userId,
      amount: amt,
      note: note.trim() || null,
      date: new Date().toISOString().slice(0, 10),
    });
    setSaving(false);
    setAdding(false);
    setAmount("");
    setNote("");
  }

  return (
    <div className="bg-card rounded-[14px] border-[0.5px] border-[rgba(44,40,32,0.07)] px-4 py-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-[500] text-ink">{pot.name}</p>
        {canContribute && (
          <button onClick={() => setAdding((v) => !v)} className="text-[12px] text-accent font-[500]">
            + Add
          </button>
        )}
      </div>

      {pot.goal_amount ? (
        <div className="flex flex-col gap-1">
          <div className="h-[6px] bg-cream2 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: "#6A9E7A" }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-ink3">
            <span>{formatCurrency(total)}</span>
            <span>{formatCurrency(pot.goal_amount)}</span>
          </div>
        </div>
      ) : (
        <p className="text-[13px] font-[500] text-ink">{formatCurrency(total)}</p>
      )}

      {contributions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {contributions.slice(0, 5).map((c) => {
            const profile = memberProfiles[c.user_id];
            return (
              <div key={c.id} className="flex items-center gap-2">
                <Avatar src={profile?.photo_url} name={profile?.display_name || "?"} accentColour={profile?.accent_colour} size={20} />
                <span className="text-[12px] text-ink2 flex-1">{profile?.display_name?.split(" ")[0]}</span>
                {c.note && <span className="text-[11px] text-ink3 truncate max-w-[80px]">{c.note}</span>}
                <span className="text-[12px] font-[500] text-green">{formatCurrency(c.amount)}</span>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2 overflow-hidden"
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-ink2">£</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full bg-cream2 rounded-[8px] pl-6 pr-3 py-2 text-[13px] text-ink border-[0.5px] border-[rgba(44,40,32,0.12)]"
                />
              </div>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (optional)"
                className="flex-1 bg-cream2 rounded-[8px] px-3 py-2 text-[13px] text-ink placeholder:text-ink3 border-[0.5px] border-[rgba(44,40,32,0.12)]"
              />
            </div>
            <Button onClick={handleAdd} disabled={!amount || saving}>
              {saving ? "Saving…" : "Log contribution"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
