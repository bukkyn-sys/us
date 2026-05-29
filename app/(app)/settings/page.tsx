"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signOut } from "@/lib/auth";
import { updateUser, addGroupMember, getGroupByInviteCode } from "@/lib/db";
import { useAuthContext } from "@/lib/context/AuthContext";
import { useGroup } from "@/lib/hooks/useGroup";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "@/components/ui/Toaster";

const ACCENT_SWATCHES = [
  "#C4A882", "#A8C4B0", "#B0B8D4", "#D4A8B8", "#C4B8A8", "#B8C4A8",
];

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuthContext();
  const groupId = profile?.active_group_id ?? null;
  const { group, members, memberProfiles, loading } = useGroup(groupId);
  const router = useRouter();

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [accent, setAccent] = useState(profile?.accent_colour || ACCENT_SWATCHES[0]);
  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [bannerUrl, setBannerUrl] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [showInviteCode, setShowInviteCode] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBannerUrl(localStorage.getItem("us_banner") || "");
  }, []);

  if (!user || !profile) return null;

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setBannerUrl(url);
      localStorage.setItem("us_banner", url);
      toast("Banner updated");
    };
    reader.readAsDataURL(file);
  }

  function removeBanner() {
    setBannerUrl("");
    localStorage.removeItem("us_banner");
    toast("Banner removed");
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
    toast("Profile saved");
  }

  async function copyInviteCode() {
    if (!group?.invite_code) return;
    try {
      await navigator.clipboard.writeText(group.invite_code);
      toast("Invite code copied!");
    } catch {
      toast(group.invite_code);
    }
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
    const found = await getGroupByInviteCode(code);
    if (!found) {
      setJoinError("Group not found.");
      setJoiningGroup(false);
      return;
    }
    await addGroupMember(found.id, user.id, "member");
    await updateUser(user.id, { active_group_id: found.id });
    await refreshProfile();
    setJoiningGroup(false);
    setJoinCode("");
    toast("Joined group!");
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/onboarding");
  }

  const memberCount = loading ? null : members.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="px-4 pt-12 pb-10 flex flex-col gap-5 max-w-lg mx-auto"
    >
      <h1 className="font-display text-[28px] font-[300] tracking-[-0.5px] text-ink">Settings</h1>

      {/* Home banner */}
      <Card>
        <p className="text-[11px] font-[600] uppercase tracking-[0.08em] text-ink3 mb-3">Home banner</p>
        {bannerUrl ? (
          <div className="relative w-full rounded-[12px] overflow-hidden" style={{ height: 110 }}>
            <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <button
              onClick={removeBanner}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-ink/50 backdrop-blur flex items-center justify-center active:opacity-60 transition-opacity"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 2L10 10M10 2L2 10" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => bannerFileRef.current?.click()}
            className="w-full rounded-[12px] border border-dashed flex flex-col items-center justify-center gap-2 transition-colors active:bg-cream3"
            style={{
              height: 90,
              borderColor: "rgba(28,25,23,0.20)",
              backgroundColor: "rgba(28,25,23,0.03)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="#AAA49E" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span className="text-[12px] text-ink3">Upload banner photo</span>
          </button>
        )}
        {bannerUrl && (
          <button
            onClick={() => bannerFileRef.current?.click()}
            className="mt-2.5 text-[12px] text-accent font-[500] active:opacity-60 transition-opacity"
          >
            Change banner
          </button>
        )}
        <input
          ref={bannerFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBannerUpload}
        />
      </Card>

      {/* Profile */}
      <Card>
        <p className="text-[11px] font-[600] uppercase tracking-[0.08em] text-ink3 mb-4">Profile</p>

        <div className="flex flex-col items-center gap-3 mb-5">
          <button onClick={() => fileRef.current?.click()} className="relative active:opacity-75 transition-opacity">
            <Avatar src={photoUrl} name={displayName} accentColour={accent} size={76} />
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center shadow-sm">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 2V9M2 5.5H9" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-[500] text-ink2">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-cream2 rounded-[10px] px-3 py-2.5 text-[14px] text-ink border border-[rgba(28,25,23,0.08)] outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-[500] text-ink2">Accent colour</label>
            <div className="flex gap-3">
              {ACCENT_SWATCHES.map((c) => (
                <button
                  key={c}
                  onClick={() => setAccent(c)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                  style={{
                    backgroundColor: c,
                    border: accent === c ? `2px solid ${c}` : "1px solid rgba(28,25,23,0.10)",
                    opacity: accent === c ? 1 : 0.55,
                    transform: accent === c ? "scale(1.12)" : "scale(1)",
                  }}
                >
                  {accent === c && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 4" stroke="#1C1917" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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
          <p className="text-[11px] font-[600] uppercase tracking-[0.08em] text-ink3 mb-3">Your group</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[16px] font-[500] text-ink">{group.name}</p>
              <p className="text-[12px] text-ink3 capitalize mt-0.5">
                {group.type}
                {memberCount !== null && memberCount > 0 && ` · ${memberCount} member${memberCount !== 1 ? "s" : ""}`}
                {memberCount === 0 && " · Just you so far"}
              </p>
            </div>
            <button
              onClick={() => setShowInviteCode((v) => !v)}
              className="text-[12px] text-accent font-[500] active:opacity-60 transition-opacity"
            >
              {showInviteCode ? "Hide" : "Invite code"}
            </button>
          </div>

          {showInviteCode && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="mt-3 rounded-[12px] px-4 py-4 flex flex-col items-center gap-2"
              style={{ background: "linear-gradient(135deg, #FBF0E6 0%, #F5E8D5 100%)" }}
            >
              <p className="text-[11px] font-[500] text-ink3">Share this code to invite</p>
              <p className="text-[30px] font-[600] tracking-[0.28em] text-ink">{group.invite_code}</p>
              <button
                onClick={copyInviteCode}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-[500] bg-white shadow-sm text-ink active:opacity-60 transition-opacity mt-1"
                style={{ border: "1px solid rgba(28,25,23,0.08)" }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="4" width="7" height="7" rx="1.5" stroke="#1C1917" strokeWidth="1.2" />
                  <path d="M4 4V2.5A1.5 1.5 0 0 1 5.5 1H9.5A1.5 1.5 0 0 1 11 2.5V6.5A1.5 1.5 0 0 1 9.5 8H8" stroke="#1C1917" strokeWidth="1.2" />
                </svg>
                Copy code
              </button>
            </motion.div>
          )}

          {members.length > 0 && (
            <div className="mt-4 flex flex-col gap-3">
              {members.map((m) => {
                const p = memberProfiles[m.user_id];
                return (
                  <div key={m.user_id} className="flex items-center gap-3">
                    <Avatar src={p?.photo_url} name={p?.display_name || "?"} accentColour={p?.accent_colour} size={32} />
                    <span className="text-[13px] text-ink flex-1">{p?.display_name || "?"}</span>
                    <span className="text-[11px] text-ink3 capitalize bg-cream2 px-2.5 py-1 rounded-full">{m.role}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Join another group */}
      <Card>
        <p className="text-[11px] font-[600] uppercase tracking-[0.08em] text-ink3 mb-3">Join another group</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="6-character code"
            maxLength={6}
            className="flex-1 bg-cream2 rounded-[10px] px-3 py-2.5 text-[14px] text-ink placeholder:text-ink3 border border-[rgba(28,25,23,0.08)] uppercase tracking-[0.15em] text-center outline-none focus:border-accent transition-colors"
          />
          <button
            onClick={joinGroup}
            disabled={joiningGroup || joinCode.length < 6}
            className="bg-ink text-cream rounded-[10px] px-5 py-2.5 text-[13px] font-[500] disabled:opacity-25 active:opacity-70 transition-opacity"
          >
            {joiningGroup ? "…" : "Join"}
          </button>
        </div>
        {joinError && <p className="text-[12px] text-[#C04843] mt-2">{joinError}</p>}
      </Card>

      {/* Sign out */}
      <Button variant="danger" onClick={handleSignOut}>Sign out</Button>

      <p className="text-ink3 text-center text-[12px] pb-2">
        <span className="font-display font-[300] tracking-[-0.3px]">us.</span> · v0.1
      </p>
    </motion.div>
  );
}
