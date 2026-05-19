"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { type UserRow } from "@/lib/db";

interface MemberChipRowProps {
  members: { user_id: string; profile?: UserRow }[];
  selected: string[];
  onToggle: (userId: string) => void;
}

export function MemberChipRow({ members, selected, onToggle }: MemberChipRowProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {members.map((m) => {
        const active = selected.includes(m.user_id);
        const name = m.profile?.display_name?.split(" ")[0] || "?";
        return (
          <motion.button
            key={m.user_id}
            onClick={() => onToggle(m.user_id)}
            animate={{
              backgroundColor: active ? "#EDE0CC" : "#EDE8DF",
              borderColor: active ? "#C4A882" : "rgba(44,40,32,0.12)",
            }}
            transition={{ duration: 0.12 }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[20px] border-[0.5px]"
          >
            <Avatar
              src={m.profile?.photo_url}
              name={name}
              accentColour={m.profile?.accent_colour}
              size={18}
            />
            <span
              className="text-[12px] font-[500]"
              style={{ color: active ? "#2C2820" : "#6B6458" }}
            >
              {name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
