"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthContext } from "@/lib/context/AuthContext";
import { useGroup } from "@/lib/hooks/useGroup";
import { Card } from "@/components/ui/Card";
import { MoodCheckin } from "@/components/home/MoodCheckin";
import { PostItNote } from "@/components/home/PostItNote";
import { CountdownCard } from "@/components/home/CountdownCard";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const { user, profile } = useAuthContext();
  const groupId = profile?.active_group_id ?? null;
  const { group, members, memberProfiles } = useGroup(groupId);
  const [bannerUrl, setBannerUrl] = useState("");

  useEffect(() => {
    setBannerUrl(localStorage.getItem("us_banner") || "");
  }, []);

  if (!user || !profile || !groupId) return null;

  const firstName = profile.display_name?.split(" ")[0] ?? "there";
  const greeting = getGreeting();

  const formattedDate = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex flex-col max-w-lg mx-auto"
    >
      {/* Hero banner */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: 220,
          background: bannerUrl
            ? undefined
            : "linear-gradient(145deg, #E8DFD0 0%, #D4C9B8 50%, #C9BC9E 100%)",
        }}
      >
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
        {/* Gradient overlay for readability */}
        <div
          className="absolute inset-0"
          style={{
            background: bannerUrl
              ? "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.35) 100%)"
              : "linear-gradient(to bottom, rgba(44,40,32,0.02) 0%, rgba(44,40,32,0.12) 100%)",
          }}
        />

        {/* Centered "us." logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h1
            className="font-display text-[58px] font-[300] tracking-[-2px] select-none"
            style={{
              color: bannerUrl ? "rgba(255,255,255,0.95)" : "#2C2820",
              textShadow: bannerUrl ? "0 2px 16px rgba(0,0,0,0.3)" : "none",
            }}
          >
            us.
          </h1>
        </div>

        {/* Settings button — top right */}
        <Link
          href="/settings"
          className="absolute right-4"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 14px)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity active:opacity-60"
            style={{
              background: bannerUrl ? "rgba(255,255,255,0.18)" : "rgba(44,40,32,0.08)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: bannerUrl ? "0.5px solid rgba(255,255,255,0.25)" : "0.5px solid rgba(44,40,32,0.12)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
              <circle
                cx="11" cy="11" r="2.5"
                stroke={bannerUrl ? "rgba(255,255,255,0.9)" : "#2C2820"}
                strokeWidth="1.3"
              />
              <path
                d="M11 3V4.5M11 17.5V19M3 11H4.5M17.5 11H19M5.15 5.15L6.2 6.2M15.8 15.8L16.85 16.85M5.15 16.85L6.2 15.8M15.8 6.2L16.85 5.15"
                stroke={bannerUrl ? "rgba(255,255,255,0.9)" : "#2C2820"}
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </Link>
      </div>

      {/* Welcome text */}
      <div className="px-5 pt-5 pb-1">
        <p className="font-display text-[24px] font-[300] tracking-[-0.5px] text-ink leading-snug">
          {greeting}, {firstName}.
        </p>
        <p className="text-[13px] text-ink3 mt-0.5">{formattedDate}</p>
      </div>

      {/* Content */}
      <div className="px-4 pt-3 pb-8 flex flex-col gap-4">
        {/* Mood check-in */}
        <Card>
          <MoodCheckin
            groupId={groupId}
            userId={user.id}
            members={memberList}
            inviteCode={group?.invite_code}
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
      </div>
    </motion.div>
  );
}
