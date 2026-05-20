"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signOut } from "@/lib/auth";
import { updateUser, addGroupMember, getGroupByInviteCode } from "@/lib/db";
import { useAuthContext } from "@/lib/context/AuthContext";
import { useGroup } from "@/lib/hooks/useGroup";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const ACCENT_SWATCHES = [
  "#C4A882", "#A8C4B0", "#B0B8D4", "#D4A8B8", "#C4B8A8", "#B8C4A8",
];

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuthContext();
  const groupId = profile?.active_group_id ?? null;
  const { group, members, memberProfiles } = useGroup(groupId);
  const router = useRouter();

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [accent, setAccent] = useState(profile?.accent_colour || ACCENT_SWATCHES[0]);
  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [joinCode, setJoinCode] = useState("");
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [joinError, setJoinError] = useState("");

  const [showInviteCode, setShowInviteCode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user || !profile) return null;

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    if (!user) return;
    setSavingProfile(true);
    await updateUser(user.id, {
      display_name: displayName.trim(),
      photo_url: photoUrl,
      accent_colour: accent,
    });
    await refreshProfile();
    setSavingProfile(false);
  }

  async function joinGroup() {
    if (!user) return;
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setJoinError("Enter a valid 6-character code.");
      return;
    }
    setJoiningGroup(true);
    setJoinError("");
    const group = await getGroupByInviteCode(code);
    if (!group) {
      setJoinError("Group not found.");
      setJoiningGroup(false);
      return;
    }
    await addGroupMember(group.id, user.id, "member");
    await updateUser(user.id, { active_group_id: group.id });
    await refreshProfile();
    setJoiningGroup(false);
    setJoinCode("");
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/onboarding");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="px-4 pt-12 pb-8 flex flex-col gap-5 max-w-lg mx-auto"
    >
      <h1 className="text-[22px] font-[500] tracking-[-0.5px] text-ink">Settings</h1>

      {/* Profile */}
      <Card>
        <p className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3 mb-3">Profile</p>

        <div className="flex flex-col items-center gap-3 mb-4">
          <button onClick={() => fileRef.current?.click()} className="relative">
            <Avatar src={photoUrl} name={displayName} accentColour={accent} size={72} />
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-ink flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 2V8M2 5H8" stroke="#F5F0E8" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-cream2 rounded-[8px] px-3 py-2.5 text-[13px] text-ink border-[0.5px] border-[rgba(44,40,32,0.12)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">Accent colour</label>
            <div className="flex gap-2">
              {ACCENT_SWATCHES.map((c) => (
                <button
                  key={c}
                  onClick={() => setAccent(c)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: c,
                    border: accent === c ? `2px solid ${c}` : "0.5px solid rgba(44,40,32,0.12)",
                    opacity: accent === c ? 1 : 0.6,
                  }}
                >
                  {accent === c && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 4" stroke="#2C2820" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={saveProfile} disabled={savingProfile || !displayName.trim()}>
            {savingProfile ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </Card>

      {/* Current group */}
      {group && (
        <Card>
          <p className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3 mb-3">Current group</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-[500] text-ink">{group.name}</p>
              <p className="text-[12px] text-ink3 capitalize">{group.type} · {members.length} member{members.length !== 1 ? "s" : ""}</p>
            </div>
            <button
              onClick={() => setShowInviteCode((v) => !v)}
              className="text-[12px] text-accent font-[500]"
            >
              {showInviteCode ? "Hide code" : "Invite code"}
            </button>
          </div>
          {showInviteCode && (
            <div className="mt-3 bg-cream2 rounded-[8px] px-4 py-3 flex items-center justify-center">
              <p className="text-[22px] font-[500] tracking-[0.2em] text-ink">{group.invite_code}</p>
            </div>
          )}

          {/* Members */}
          <div className="mt-3 flex flex-col gap-2">
            {members.map((m) => {
              const p = memberProfiles[m.user_id];
              return (
                <div key={m.user_id} className="flex items-center gap-2.5">
                  <Avatar src={p?.photo_url} name={p?.display_name || "?"} accentColour={p?.accent_colour} size={28} />
                  <span className="text-[13px] text-ink flex-1">{p?.display_name || "?"}</span>
                  <span className="text-[11px] text-ink3 capitalize">{m.role}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Join another group */}
      <Card>
        <p className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3 mb-3">Join another group</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="6-character code"
            maxLength={6}
            className="flex-1 bg-cream2 rounded-[8px] px-3 py-2.5 text-[13px] text-ink placeholder:text-ink3 border-[0.5px] border-[rgba(44,40,32,0.12)] uppercase tracking-[0.15em] text-center"
          />
          <button
            onClick={joinGroup}
            disabled={joiningGroup || joinCode.length < 6}
            className="bg-ink text-cream rounded-[8px] px-4 py-2.5 text-[13px] font-[500] disabled:opacity-40"
          >
            {joiningGroup ? "…" : "Join"}
          </button>
        </div>
        {joinError && <p className="text-[12px] text-red mt-2">{joinError}</p>}
      </Card>

      {/* Sign out */}
      <Button variant="outline" onClick={handleSignOut}>
        Sign out
      </Button>

      <p className="text-ink3 text-center text-[13px]"><span className="font-display font-[300] tracking-[-0.3px]">us.</span> · v0.1</p>
    </motion.div>
  );
}
