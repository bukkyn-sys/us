"use client";

import { motion } from "framer-motion";
import { useAuthContext } from "@/lib/context/AuthContext";
import { useGroup } from "@/lib/hooks/useGroup";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { MoodCheckin } from "@/components/home/MoodCheckin";
import { PostItNote } from "@/components/home/PostItNote";
import { CountdownCard } from "@/components/home/CountdownCard";

export default function HomePage() {
  const { user, profile } = useAuthContext();
  const groupId = profile?.active_group_id ?? null;
  const { group, members, memberProfiles } = useGroup(groupId);

  if (!user || !profile || !groupId) return null;

  const memberList = members.map((m) => ({
    user_id: m.user_id,
    profile: memberProfiles[m.user_id],
  }));

  const memberNames: Record<string, string> = {};
  members.forEach((m) => {
    memberNames[m.user_id] = memberProfiles[m.user_id]?.display_name ?? "Someone";
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="px-4 pt-12 pb-6 flex flex-col gap-4 max-w-lg mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[26px] font-[300] tracking-[-0.5px] text-ink leading-tight">
            {group?.name ?? "us."}
          </h1>
          <p className="text-[13px] text-ink3">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <Avatar
          src={profile.photo_url}
          name={profile.display_name}
          accentColour={profile.accent_colour}
          size={36}
        />
      </div>

      {/* Mood check-in */}
      <Card>
        <MoodCheckin
          groupId={groupId}
          userId={user.id}
          members={memberList}
        />
      </Card>

      {/* Post-it note */}
      <PostItNote
        groupId={groupId}
        userId={user.id}
        memberNames={memberNames}
      />

      {/* Countdowns */}
      <Card>
        <CountdownCard groupId={groupId} userId={user.id} />
      </Card>
    </motion.div>
  );
}
