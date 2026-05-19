"use client";

import { motion } from "framer-motion";

type DayStatus = "free" | "busy" | "unselected";

interface DayCellProps {
  day: number;
  colour: "green" | "red" | "amber" | "none";
  myStatus: DayStatus;
  isToday: boolean;
  isPast: boolean;
  isCurrentMonth: boolean;
  onClick?: () => void;
}

const colourMap = {
  green: { bg: "#E4F0E7", text: "#2C2820" },
  red: { bg: "#FAE8E7", text: "#2C2820" },
  amber: { bg: "#FAF0DC", text: "#2C2820" },
  none: { bg: "transparent", text: "#2C2820" },
};

export function DayCell({
  day,
  colour,
  myStatus,
  isToday,
  isPast,
  isCurrentMonth,
  onClick,
}: DayCellProps) {
  const { bg, text } = colourMap[colour];
  const dimmed = !isCurrentMonth;

  return (
    <motion.button
      onClick={!isPast ? onClick : undefined}
      animate={{ backgroundColor: bg }}
      transition={{ duration: 0.12 }}
      className="relative flex flex-col items-center justify-center aspect-square rounded-[8px]"
      style={{
        cursor: isPast ? "default" : "pointer",
        opacity: dimmed ? 0.3 : isPast && isCurrentMonth ? 0.5 : 1,
      }}
    >
      <span
        className="text-[13px] font-[400]"
        style={{
          color: isToday ? "#C4A882" : text,
          fontWeight: isToday ? "500" : "400",
        }}
      >
        {day}
      </span>

      {/* My free dot */}
      {myStatus === "free" && (
        <span
          className="absolute bottom-[3px] w-1 h-1 rounded-full"
          style={{ backgroundColor: "#6A9E7A" }}
        />
      )}

      {/* Today ring */}
      {isToday && (
        <span
          className="absolute inset-0 rounded-[8px] border-[0.5px]"
          style={{ borderColor: "#C4A882" }}
        />
      )}
    </motion.button>
  );
}
