"use client";

import { motion } from "framer-motion";

interface FilterPillsProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterPills({ options, value, onChange }: FilterPillsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <motion.button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            animate={{
              backgroundColor: active ? "#2C2820" : "#EDE8DF",
              color: active ? "#F5F0E8" : "#6B6458",
            }}
            transition={{ duration: 0.12 }}
            className="flex-shrink-0 px-3 py-1.5 rounded-[20px] text-[12px] font-[500] border-[0.5px] border-[rgba(44,40,32,0.07)]"
          >
            {opt.label}
          </motion.button>
        );
      })}
    </div>
  );
}
