"use client";

import { useState, useEffect } from "react";
import {
  subscribeExpenses,
  subscribeSavingPots,
  type ExpenseRow,
  type SavingPotRow,
} from "../db";

export function useLedger(groupId: string | null, userId: string | null) {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [savingPots, setSavingPots] = useState<SavingPotRow[]>([]);

  useEffect(() => {
    if (!groupId || !userId) return;
    const unsub1 = subscribeExpenses(groupId, userId, setExpenses);
    const unsub2 = subscribeSavingPots(groupId, userId, setSavingPots);
    return () => {
      unsub1();
      unsub2();
    };
  }, [groupId, userId]);

  function netBalance(): number {
    if (!userId) return 0;
    let balance = 0;
    for (const e of expenses) {
      const mySplit = e.splits.find((s) => s.user_id === userId);
      if (!mySplit) continue;
      if (e.paid_by === userId) {
        const othersOwe = e.splits
          .filter((s) => s.user_id !== userId)
          .reduce((acc, s) => acc + s.amount, 0);
        balance += othersOwe;
      } else {
        balance -= mySplit.amount;
      }
    }
    return balance;
  }

  return { expenses, savingPots, netBalance };
}
