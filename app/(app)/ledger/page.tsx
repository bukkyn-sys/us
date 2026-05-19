"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { addSettlement, addSavingPot } from "@/lib/db";
import { useAuthContext } from "@/lib/context/AuthContext";
import { useGroup } from "@/lib/hooks/useGroup";
import { useLedger } from "@/lib/hooks/useLedger";
import { ExpenseItem } from "@/components/ledger/ExpenseItem";
import { SplitModal } from "@/components/ledger/SplitModal";
import { PotCard } from "@/components/ledger/PotCard";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

type Tab = "expenses" | "savings";
type ExpenseFilter = "all" | "i_paid" | "i_owe";

export default function LedgerPage() {
  const { user, profile } = useAuthContext();
  const groupId = profile?.active_group_id ?? null;
  const { members, memberProfiles } = useGroup(groupId);
  const { expenses, savingPots, netBalance } = useLedger(groupId, user?.id ?? null);

  const [tab, setTab] = useState<Tab>("expenses");
  const [filter, setFilter] = useState<ExpenseFilter>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showAddPot, setShowAddPot] = useState(false);
  const [settledIds, setSettledIds] = useState<Set<string>>(new Set());

  if (!user || !profile || !groupId) return null;

  const balance = netBalance();

  const memberList = members.map((m) => ({
    user_id: m.user_id,
    profile: memberProfiles[m.user_id],
  }));

  const filteredExpenses = expenses.filter((e) => {
    if (filter === "i_paid") return e.paid_by === user.id;
    if (filter === "i_owe") return e.paid_by !== user.id && e.splits.some((s) => s.user_id === user.id);
    return true;
  });

  async function settle(expenseId: string, creditorId: string) {
    await addSettlement({
      expense_id: expenseId,
      debtor_id: user!.id,
      creditor_id: creditorId,
    });
    setSettledIds((prev) => new Set(Array.from(prev).concat(expenseId)));
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="px-4 pt-12 pb-6 flex flex-col gap-4 max-w-lg mx-auto"
      >
        {/* Header */}
        <h1 className="text-[22px] font-[500] tracking-[-0.5px] text-ink">Ledger</h1>

        {/* Tab toggle */}
        <SegmentedControl
          options={[
            { label: "Expenses", value: "expenses" },
            { label: "Savings", value: "savings" },
          ]}
          value={tab}
          onChange={(v) => setTab(v as Tab)}
        />

        {tab === "expenses" && (
          <>
            {/* Balance summary */}
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3 mb-0.5">
                    Net balance
                  </p>
                  <p
                    className="text-[20px] font-[500]"
                    style={{ color: balance >= 0 ? "#6A9E7A" : "#D4645A" }}
                  >
                    {balance >= 0 ? "+" : ""}{formatCurrency(Math.abs(balance))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-ink2">
                    {balance > 0
                      ? "You are owed"
                      : balance < 0
                      ? "You owe"
                      : "All settled"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Filter */}
            <div className="flex gap-2">
              {(["all", "i_paid", "i_owe"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-[20px] text-[12px] font-[500] border-[0.5px] transition-colors ${
                    filter === f
                      ? "bg-ink text-cream border-ink"
                      : "bg-cream2 text-ink2 border-[rgba(44,40,32,0.12)]"
                  }`}
                >
                  {f === "all" ? "All" : f === "i_paid" ? "I paid" : "I owe"}
                </button>
              ))}
            </div>

            {/* Expenses */}
            {filteredExpenses.length === 0 && (
              <p className="text-[13px] text-ink3 text-center py-4">No expenses yet.</p>
            )}
            <div className="flex flex-col gap-2">
              {filteredExpenses.map((e) => (
                <ExpenseItem
                  key={e.id}
                  expense={e}
                  userId={user.id}
                  memberProfiles={memberProfiles}
                  settled={settledIds.has(e.id)}
                  onSettle={() => settle(e.id, e.paid_by)}
                />
              ))}
            </div>
          </>
        )}

        {tab === "savings" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">Saving pots</p>
              <button onClick={() => setShowAddPot(true)} className="text-[12px] text-accent font-[500]">
                + New pot
              </button>
            </div>

            {savingPots.length === 0 && (
              <p className="text-[13px] text-ink3 text-center py-4">No saving pots yet.</p>
            )}
            <div className="flex flex-col gap-2">
              {savingPots.map((pot) => (
                <PotCard key={pot.id} pot={pot} userId={user.id} memberProfiles={memberProfiles} />
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* FAB — add expense */}
      {tab === "expenses" && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed right-4 w-12 h-12 rounded-[14px] bg-ink flex items-center justify-center z-40"
          style={{ bottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4V16M4 10H16" stroke="#F5F0E8" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {showAdd && (
        <SplitModal
          groupId={groupId}
          userId={user.id}
          members={memberList}
          onClose={() => setShowAdd(false)}
        />
      )}

      {showAddPot && (
        <AddPotModal
          groupId={groupId}
          userId={user.id}
          members={memberList}
          onClose={() => setShowAddPot(false)}
        />
      )}
    </>
  );
}

// Inline add-pot modal — simple enough to keep local
function AddPotModal({
  groupId,
  userId,
  members,
  onClose,
}: {
  groupId: string;
  userId: string;
  members: { user_id: string; profile?: { display_name?: string; photo_url?: string | null; accent_colour?: string } | null }[];
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const allMemberIds = members.map((m) => m.user_id);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await addSavingPot({
      group_id: groupId,
      folder_id: null,
      name: name.trim(),
      goal_amount: goal ? parseFloat(goal) : null,
      viewers: allMemberIds,
      contributors: allMemberIds,
      created_by: userId,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-ink/30 z-50 flex items-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full bg-card rounded-t-[20px] px-5 pt-5 flex flex-col gap-4"
        style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-[500] text-ink">New saving pot</h3>
          <button onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4L14 14M14 4L4 14" stroke="#9E9488" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Pot name" className="bg-cream2 rounded-[8px] px-3 py-2.5 text-[13px] text-ink placeholder:text-ink3 border-[0.5px] border-[rgba(44,40,32,0.12)]" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">Goal amount (optional)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-ink2">£</span>
            <input type="number" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="0.00" min="0" step="0.01" className="w-full bg-cream2 rounded-[8px] pl-6 pr-3 py-2.5 text-[13px] text-ink border-[0.5px] border-[rgba(44,40,32,0.12)]" />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="w-full bg-ink text-cream rounded-[14px] py-[13px] text-[14px] font-[500] disabled:opacity-40"
        >
          {saving ? "Creating…" : "Create pot"}
        </button>
      </div>
    </div>
  );
}
