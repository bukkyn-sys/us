"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addSettlement, addSavingPot } from "@/lib/db";
import { useAuthContext } from "@/lib/context/AuthContext";
import { useGroup } from "@/lib/hooks/useGroup";
import { useLedger } from "@/lib/hooks/useLedger";
import { ExpenseItem } from "@/components/ledger/ExpenseItem";
import { SplitModal } from "@/components/ledger/SplitModal";
import { PotCard } from "@/components/ledger/PotCard";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { formatCurrency } from "@/lib/utils";

type Tab = "expenses" | "savings";
type ExpenseFilter = "all" | "i_paid" | "i_owe";

const FILTERS: { label: string; value: ExpenseFilter }[] = [
  { label: "All", value: "all" },
  { label: "I paid", value: "i_paid" },
  { label: "I owe", value: "i_owe" },
];

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
    await addSettlement({ expense_id: expenseId, debtor_id: user!.id, creditor_id: creditorId });
    setSettledIds((prev) => new Set(Array.from(prev).concat(expenseId)));
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="px-4 pt-12 pb-8 flex flex-col gap-4 max-w-lg mx-auto"
      >
        {/* Header */}
        <h1 className="font-display text-[26px] font-[300] tracking-[-0.5px] text-ink">Ledger</h1>

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
            {/* Balance hero */}
            <div
              className="rounded-[16px] px-5 py-4"
              style={{ backgroundColor: balance >= 0 ? "#E4F0E7" : "#FAE8E7" }}
            >
              <p className="text-[11px] font-[500] uppercase tracking-[0.1em]" style={{ color: balance >= 0 ? "#4A7E5A" : "#A84040" }}>
                {balance > 0 ? "You are owed" : balance < 0 ? "You owe" : "All settled"}
              </p>
              <p
                className="text-[32px] font-[300] tracking-[-1px] mt-1"
                style={{ color: balance >= 0 ? "#2C6040" : "#8C2020" }}
              >
                {balance === 0 ? "—" : `${balance >= 0 ? "+" : ""}${formatCurrency(Math.abs(balance))}`}
              </p>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className="px-4 py-2 rounded-full text-[12px] font-[500] transition-colors"
                  style={{
                    backgroundColor: filter === f.value ? "#2C2820" : "rgba(44,40,32,0.07)",
                    color: filter === f.value ? "#F5F0E8" : "#6B6458",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredExpenses.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-[13px] text-ink3">No expenses yet.</p>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <AnimatePresence initial={false}>
                {filteredExpenses.map((e) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <ExpenseItem
                      expense={e}
                      userId={user.id}
                      memberProfiles={memberProfiles}
                      settled={settledIds.has(e.id)}
                      onSettle={() => settle(e.id, e.paid_by)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

        {tab === "savings" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">Saving pots</p>
              <motion.button
                onClick={() => setShowAddPot(true)}
                whileTap={{ scale: 0.92 }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-[500]"
                style={{ backgroundColor: "#2C2820", color: "#F5F0E8" }}
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> New pot
              </motion.button>
            </div>

            {savingPots.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-[13px] text-ink3">No saving pots yet.</p>
              </div>
            )}
            <div className="flex flex-col gap-2.5">
              {savingPots.map((pot) => (
                <PotCard key={pot.id} pot={pot} userId={user.id} memberProfiles={memberProfiles} />
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* FAB — add expense */}
      {tab === "expenses" && (
        <motion.button
          onClick={() => setShowAdd(true)}
          whileTap={{ scale: 0.91 }}
          className="fixed right-4 z-40 flex items-center gap-2 pl-3 pr-4 rounded-full"
          style={{
            bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
            backgroundColor: "#2C2820",
            height: 48,
            boxShadow: "0 4px 16px rgba(44,40,32,0.28)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="#F5F0E8" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-[13px] font-[500] text-cream">Add expense</span>
        </motion.button>
      )}

      <AnimatePresence>
        {showAdd && (
          <SplitModal
            groupId={groupId}
            userId={user.id}
            members={memberList}
            onClose={() => setShowAdd(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddPot && (
          <AddPotModal
            groupId={groupId}
            userId={user.id}
            members={memberList}
            onClose={() => setShowAddPot(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

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
        style={{ paddingBottom: "calc(28px + env(safe-area-inset-bottom, 0px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "rgba(44,40,32,0.15)" }} />
        </div>

        <div className="flex flex-col gap-5 px-5 pb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[18px] font-[500] text-ink">New saving pot</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(44,40,32,0.06)" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3L11 11M11 3L3 11" stroke="#9E9488" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-[600] uppercase tracking-[0.1em] text-ink3">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Holiday fund"
              autoFocus
              className="bg-cream2 rounded-[10px] px-3 py-3 text-[14px] text-ink placeholder:text-ink3 border-[0.5px] border-[rgba(44,40,32,0.12)] outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-[600] uppercase tracking-[0.1em] text-ink3">Goal amount (optional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-ink3">£</span>
              <input
                type="number"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full bg-cream2 rounded-[10px] pl-7 pr-3 py-3 text-[14px] text-ink border-[0.5px] border-[rgba(44,40,32,0.12)] outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="w-full bg-ink text-cream rounded-[14px] py-[14px] text-[14px] font-[500] disabled:opacity-35 active:opacity-70 transition-opacity"
          >
            {saving ? "Creating…" : "Create pot"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
