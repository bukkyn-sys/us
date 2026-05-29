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
      whileTap={tappable ? { scale: 0.84 } : undefined}
      transition={{ duration: 0.1 }}
      className="relative flex flex-col items-center justify-center aspect-square select-none"
      style={{
        cursor: tappable ? "pointer" : "default",
        opacity: !isCurrentMonth ? 0.18 : isPast ? 0.5 : 1,
      }}
    >
      {/* Background tile */}
      <motion.span
        className="absolute inset-[2px] rounded-[9px]"
        animate={{ backgroundColor: isToday && colour === "none" ? "#FBF0E6" : bg }}
        transition={{ duration: 0.14 }}
      />

      {/* Today ring */}
      {isToday && (
        <span
          className="absolute inset-[2px] rounded-[9px]"
          style={{ border: "1.5px solid rgba(192,107,50,0.45)" }}
        />
      )}

      {/* Day number */}
      <span
        className="relative z-10 leading-none"
        style={{
          fontSize: 13,
          fontWeight: isToday ? 700 : 400,
          color: isToday ? "#C06B32" : "#1C1917",
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
            backgroundColor: myStatus === "free" ? "#4D9163" : "#C04843",
          }}
        />
      )}
    </motion.button>
  );
}
