"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "@/lib/context/AuthContext";
import { upsertUser, addGroupMember, createGroup, getGroupByInviteCode } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

const ACCENT_SWATCHES = [
  "#C4A882",
  "#A8C4B0",
  "#B0B8D4",
  "#D4A8B8",
  "#C4B8A8",
  "#B8C4A8",
];

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

type Step = "profile" | "accent" | "group";

export function SetupScreen() {
  const { user, refreshProfile } = useAuthContext();
  const router = useRouter();

  const [step, setStep] = useState<Step>("profile");
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || user?.user_metadata?.name || ""
  );
  const [photoUrl, setPhotoUrl] = useState(
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture || ""
  );
  const [accent, setAccent] = useState(ACCENT_SWATCHES[0]);
  const [groupMode, setGroupMode] = useState<"create" | "join">("create");
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState<"couple" | "group">("couple");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const steps: Step[] = ["profile", "accent", "group"];
  const stepIndex = steps.indexOf(step);

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleFinish() {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      if (groupMode === "create") {
        if (!groupName.trim()) {
          setError("Please enter a group name.");
          setLoading(false);
          return;
        }
        const code = generateInviteCode();
        const group = await createGroup({
          name: groupName.trim(),
          type: groupType,
          invite_code: code,
          created_by: user.id,
        });
        await addGroupMember(group.id, user.id, "owner");
        await upsertUser(user.id, {
          display_name: displayName.trim() || user.user_metadata?.full_name || "",
          photo_url: photoUrl || null,
          accent_colour: accent,
          active_group_id: group.id,
        });
      } else {
        const code = inviteCode.trim().toUpperCase();
        if (code.length !== 6) {
          setError("Please enter a valid 6-character code.");
          setLoading(false);
          return;
        }
        const group = await getGroupByInviteCode(code);
        if (!group) {
          setError("Group not found. Check the invite code.");
          setLoading(false);
          return;
        }
        await addGroupMember(group.id, user.id, "member");
        await upsertUser(user.id, {
          display_name: displayName.trim() || user.user_metadata?.full_name || "",
          photo_url: photoUrl || null,
          accent_colour: accent,
          active_group_id: group.id,
        });
      }
      await refreshProfile();
      router.replace("/home");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center px-6 py-10"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}
    >
      {/* Progress dots */}
      <div className="flex gap-2 mb-10 mt-4">
        {steps.map((s, i) => (
          <div
            key={s}
            className="rounded-full transition-all duration-200"
            style={{
              width: i === stepIndex ? 20 : 8,
              height: 8,
              backgroundColor: i <= stepIndex ? "#2C2820" : "#E3DDD3",
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-sm flex-1">
        <AnimatePresence mode="wait">
          {step === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex flex-col gap-6"
            >
              <div>
                <h2 className="text-[22px] font-[500] tracking-[-0.5px] text-ink mb-1">
                  Set up your profile
                </h2>
                <p className="text-[13px] text-ink2">This is how others will see you.</p>
              </div>

              {/* Photo */}
              <div className="flex flex-col items-center gap-3">
                <button onClick={() => fileRef.current?.click()} className="relative">
                  <Avatar
                    src={photoUrl}
                    name={displayName || user?.user_metadata?.full_name || "?"}
                    accentColour={accent}
                    size={80}
                  />
                  <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-ink flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2.5V9.5M2.5 6H9.5" stroke="#F5F0E8" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                <p className="text-[11px] text-ink3">Tap to change photo</p>
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  maxLength={40}
                  className="bg-card border-[0.5px] border-[rgba(44,40,32,0.12)] rounded-[8px] px-3 py-3 text-[14px] text-ink placeholder:text-ink3 w-full"
                />
              </div>

              <Button
                onClick={() => setStep("accent")}
                disabled={!displayName.trim()}
              >
                Continue
              </Button>
            </motion.div>
          )}

          {step === "accent" && (
            <motion.div
              key="accent"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex flex-col gap-6"
            >
              <div>
                <h2 className="text-[22px] font-[500] tracking-[-0.5px] text-ink mb-1">
                  Pick your colour
                </h2>
                <p className="text-[13px] text-ink2">This accent colour is yours across the app.</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {ACCENT_SWATCHES.map((colour) => (
                  <button
                    key={colour}
                    onClick={() => setAccent(colour)}
                    className="relative h-16 rounded-[14px] transition-all duration-100 active:scale-95"
                    style={{ backgroundColor: colour + "60", border: accent === colour ? `2px solid ${colour}` : "0.5px solid rgba(44,40,32,0.12)" }}
                  >
                    {accent === colour && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M4 10L8.5 14.5L16 6" stroke="#2C2820" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("profile")}>
                  Back
                </Button>
                <Button onClick={() => setStep("group")}>Continue</Button>
              </div>
            </motion.div>
          )}

          {step === "group" && (
            <motion.div
              key="group"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex flex-col gap-6"
            >
              <div>
                <h2 className="text-[22px] font-[500] tracking-[-0.5px] text-ink mb-1">
                  Your group
                </h2>
                <p className="text-[13px] text-ink2">Create a new space or join an existing one.</p>
              </div>

              {/* Mode toggle */}
              <div className="flex bg-cream2 rounded-[10px] p-[3px] gap-[2px]">
                {(["create", "join"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setGroupMode(mode)}
                    className={`flex-1 py-2 rounded-[8px] text-[13px] font-[500] transition-colors ${
                      groupMode === mode
                        ? "bg-card text-ink border-[0.5px] border-[rgba(44,40,32,0.10)]"
                        : "text-ink3"
                    }`}
                  >
                    {mode === "create" ? "Create group" : "Join with code"}
                  </button>
                ))}
              </div>

              {groupMode === "create" ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">
                      Group name
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="e.g. Us, The Fam, Our House"
                      maxLength={40}
                      className="bg-card border-[0.5px] border-[rgba(44,40,32,0.12)] rounded-[8px] px-3 py-3 text-[14px] text-ink placeholder:text-ink3 w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">
                      Group type
                    </label>
                    <div className="flex gap-2">
                      {(["couple", "group"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setGroupType(t)}
                          className={`flex-1 py-2.5 rounded-[8px] text-[13px] font-[500] border-[0.5px] transition-colors ${
                            groupType === t
                              ? "bg-ink text-cream border-ink"
                              : "bg-card text-ink2 border-[rgba(44,40,32,0.12)]"
                          }`}
                        >
                          {t === "couple" ? "Couple (2)" : "Group (3–10)"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">
                    Invite code
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="6-character code"
                    maxLength={6}
                    className="bg-card border-[0.5px] border-[rgba(44,40,32,0.12)] rounded-[8px] px-3 py-3 text-[14px] text-ink placeholder:text-ink3 w-full uppercase tracking-[0.2em] text-center"
                  />
                </div>
              )}

              {error && (
                <p className="text-[13px] text-red">{error}</p>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("accent")}>
                  Back
                </Button>
                <Button onClick={handleFinish} disabled={loading}>
                  {loading ? (
                    <span className="w-5 h-5 rounded-full border-2 border-cream border-t-transparent animate-spin mx-auto block" />
                  ) : (
                    "Get started"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
