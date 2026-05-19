"use client";

import { useMemo } from "react";
import { DayCell } from "./DayCell";
import { type AvailabilityRow } from "@/lib/db";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed
  availability: AvailabilityRow[];
  selectedMembers: string[];
  userId: string;
  onDayPress: (dateStr: string) => void;
}

export function CalendarGrid({
  year,
  month,
  availability,
  selectedMembers,
  userId,
  onDayPress,
}: CalendarGridProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { cells } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: { day: number; inMonth: boolean; date: Date }[] = [];

    for (let i = startDow - 1; i >= 0; i--) {
      cells.push({
        day: prevMonthDays - i,
        inMonth: false,
        date: new Date(year, month - 1, prevMonthDays - i),
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, inMonth: true, date: new Date(year, month, d) });
    }
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, inMonth: false, date: new Date(year, month + 1, d) });
    }

    return { cells };
  }, [year, month]);

  function getDateStr(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  function getDayColour(dateStr: string): "green" | "red" | "amber" | "none" {
    if (selectedMembers.length === 0) return "none";

    const relevant = availability.filter(
      (a) => a.date === dateStr && selectedMembers.includes(a.user_id)
    );

    const hasBusy = relevant.some((a) => a.status === "busy");
    if (hasBusy) return "red";

    const freeCount = relevant.filter((a) => a.status === "free").length;
    if (freeCount === selectedMembers.length) return "green";
    if (freeCount > 0) return "amber";

    return "none";
  }

  function getMyStatus(dateStr: string): "free" | "busy" | "unselected" {
    const mine = availability.find((a) => a.date === dateStr && a.user_id === userId);
    return mine?.status ?? "unselected";
  }

  return (
    <div className="flex flex-col flex-1 select-none">
      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-[2px] flex-1">
        {cells.map((cell, i) => {
          const dateStr = getDateStr(cell.date);
          const isPast = cell.date < today;
          const isToday = cell.date.getTime() === today.getTime();
          const colour = cell.inMonth ? getDayColour(dateStr) : "none";
          const myStatus = cell.inMonth ? getMyStatus(dateStr) : "unselected";

          return (
            <DayCell
              key={i}
              day={cell.day}
              colour={colour}
              myStatus={myStatus}
              isToday={isToday}
              isPast={isPast}
              isCurrentMonth={cell.inMonth}
              onClick={() => cell.inMonth && onDayPress(dateStr)}
            />
          );
        })}
      </div>
    </div>
  );
}
