import { type ExpenseRow, type UserRow } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

interface ExpenseItemProps {
  expense: ExpenseRow;
  userId: string;
  memberProfiles: Record<string, UserRow>;
  settled?: boolean;
  onSettle?: () => void;
}

export function ExpenseItem({ expense, userId, memberProfiles, settled, onSettle }: ExpenseItemProps) {
  const payer = memberProfiles[expense.paid_by];
  const iAmPayer = expense.paid_by === userId;
  const mySplit = expense.splits.find((s) => s.user_id === userId);

  return (
    <div
      className="bg-card rounded-[18px] shadow-card px-4 py-4"
      style={{ opacity: settled ? 0.5 : 1 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-[500] text-ink truncate">{expense.title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Avatar
              src={payer?.photo_url}
              name={payer?.display_name || "?"}
              accentColour={payer?.accent_colour}
              size={16}
            />
            <span className="text-[12px] text-ink3">
              {iAmPayer ? "You paid" : `${payer?.display_name?.split(" ")[0] ?? "?"} paid`}
              {" · "}{expense.date}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[16px] font-[500] text-ink">{formatCurrency(expense.total)}</p>
          {mySplit && (
            <p className="text-[12px] mt-0.5" style={{ color: iAmPayer ? "#4D9163" : "#C04843" }}>
              {iAmPayer ? `owed ${formatCurrency(expense.total - mySplit.amount)}` : `you owe ${formatCurrency(mySplit.amount)}`}
            </p>
          )}
        </div>
      </div>

      {/* Splits breakdown */}
      <div className="mt-3 pt-3 border-t border-[rgba(28,25,23,0.06)] flex flex-col gap-2">
        {expense.splits.map((s) => {
          const profile = memberProfiles[s.user_id];
          return (
            <div key={s.user_id} className="flex items-center gap-2">
              <Avatar
                src={profile?.photo_url}
                name={profile?.display_name || "?"}
                accentColour={profile?.accent_colour}
                size={18}
              />
              <span className="text-[12px] text-ink2 flex-1">
                {s.user_id === userId ? "You" : (profile?.display_name?.split(" ")[0] || "?")}
              </span>
              <span className="text-[12px] text-ink3">{s.pct}%</span>
              <span className="text-[12px] font-[500] text-ink">{formatCurrency(s.amount)}</span>
            </div>
          );
        })}
      </div>

      {/* Settle button */}
      {!iAmPayer && mySplit && !settled && onSettle && (
        <button
          onClick={onSettle}
          className="mt-3 text-[12px] font-[600] text-accent active:opacity-60 transition-opacity"
        >
          Mark as settled →
        </button>
      )}
    </div>
  );
}
