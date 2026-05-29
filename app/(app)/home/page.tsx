"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthContext } from "@/lib/context/AuthContext";
import { useGroup } from "@/lib/hooks/useGroup";
import { MoodCheckin } from "@/components/home/MoodCheckin";
import { PostItNote } from "@/components/home/PostItNote";
import { CountdownCard } from "@/components/home/CountdownCard";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return "Still up?";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Good night";
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
  const formattedDate = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
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
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col max-w-lg mx-auto"
    >
      {/* ── Hero banner ───────────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: 240 }}
      >
        {bannerUrl ? (
          <img src={bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : null}

        {/* Gradient — dark & rich with or without photo */}
        <div
          className="absolute inset-0"
          style={{
            background: bannerUrl
              ? "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.50) 100%)"
              : "linear-gradient(155deg, #1E1811 0%, #3A2B1C 40%, #6B4422 75%, #9B6335 100%)",
          }}
        />

        {/* "us." logotype */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.h1
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="font-display font-[300] select-none"
            style={{
              fontSize: 72,
              letterSpacing: "-3px",
              color: "rgba(255,255,255,0.95)",
              textShadow: "0 2px 24px rgba(0,0,0,0.3)",
            }}
          >
            us.
          </motion.h1>
        </div>

        {/* Settings button */}
        <Link
          href="/settings"
          className="absolute right-4 active:opacity-60 transition-opacity"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 14px)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.20)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="2.5" stroke="rgba(255,255,255,0.9)" strokeWidth="1.4" />
              <path
                d="M11 3V4.5M11 17.5V19M3 11H4.5M17.5 11H19M5.15 5.15L6.2 6.2M15.8 15.8L16.85 16.85M5.15 16.85L6.2 15.8M15.8 6.2L16.85 5.15"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </Link>
      </div>

      {/* ── Welcome ───────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-2">
        <h2 className="font-display text-[28px] font-[300] tracking-[-0.5px] text-ink leading-tight">
          {getGreeting()}, {firstName}.
        </h2>
        <p className="text-[13px] text-ink3 mt-1">{formattedDate}</p>
      </div>

      {/* ── Cards ─────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-8 flex flex-col gap-4">

        {/* Mood */}
        <MoodCheckin
          groupId={groupId}
          userId={user.id}
          members={memberList}
          inviteCode={group?.invite_code}
        />

        {/* Note */}
        <PostItNote groupId={groupId} userId={user.id} memberNames={memberNames} />

        {/* Countdowns */}
        <CountdownCard groupId={groupId} userId={user.id} />

      </div>
    </motion.div>
  );
}
