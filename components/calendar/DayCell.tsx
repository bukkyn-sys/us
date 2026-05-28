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

const BG_MAP = {
  green: "#DCF0E1",
  red:   "#F5DEDE",
  amber: "#F5EDDA",
  none:  "transparent",
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
  const bg = BG_MAP[colour];
  const tappable = isCurrentMonth && !isPast;

  return (
    <motion.button
      onClick={tappable ? onClick : undefined}
      whileTap={tappable ? { scale: 0.86 } : undefined}
      transition={{ duration: 0.1 }}
      className="relative flex flex-col items-center justify-center aspect-square select-none"
      style={{
        cursor: tappable ? "pointer" : "default",
        opacity: !isCurrentMonth ? 0.18 : isPast ? 0.38 : 1,
      }}
    >
      {/* Background tile */}
      <motion.span
        className="absolute inset-[2px] rounded-[9px]"
        animate={{ backgroundColor: bg }}
        transition={{ duration: 0.14 }}
      />

      {/* Today ring */}
      {isToday && (
        <span
          className="absolute inset-[2px] rounded-[9px]"
          style={{ border: "1.5px solid #C4A882" }}
        />
      )}

      {/* Day number */}
      <span
        className="relative z-10 leading-none"
        style={{
          fontSize: 13,
          fontWeight: isToday ? 600 : 400,
          color: isToday ? "#C4A882" : "#2C2820",
        }}
      >
        {day}
      </span>

      {/* My status dot */}
      {isCurrentMonth && myStatus !== "unselected" && (
        <span
          className="relative z-10 rounded-full mt-[3px]"
          style={{
            width: 4,
            height: 4,
            backgroundColor: myStatus === "free" ? "#6A9E7A" : "#D4645A",
          }}
        />
      )}
    </motion.button>
  );
}
