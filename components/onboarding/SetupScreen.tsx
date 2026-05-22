"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "@/lib/context/AuthContext";
import { upsertUser, addGroupMember, createGroup, getGroupByInviteCode } from "@/lib/db";
import { supabase, ensureAuth } from "@/lib/supabase";

const SWATCHES = [
  { colour: "#C4A882", name: "Sand" },
  { colour: "#A8C4B0", name: "Sage" },
  { colour: "#B0B8D4", name: "Slate" },
  { colour: "#D4A8B8", name: "Blush" },
  { colour: "#C4B8A8", name: "Stone" },
  { colour: "#B8C4A8", name: "Moss" },
];

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

type Step = "profile" | "colour" | "group";
const STEPS: Step[] = ["profile", "colour", "group"];

const variants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

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
  const [accent, setAccent] = useState(SWATCHES[0].colour);
  const [groupMode, setGroupMode] = useState<"create" | "join">("create");
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState<"couple" | "group">("couple");
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleFinish() {
    if (!user) return;
    setSubmitting(true);
    setError("");
    try {
      // Inject Bearer token into PostgREST headers before any DB operation
      await ensureAuth();

      // Get authoritative user ID from the live session — ensures auth.uid()
      // in RLS policies matches the ID we use in all inserts.
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Session expired — please sign in again.");
      const uid = authUser.id;

      // Upsert user row first so the groups FK is satisfied
      await upsertUser(uid, {
        display_name: displayName.trim() || user.user_metadata?.full_name || "",
        photo_url: photoUrl || null,
        accent_colour: accent,
      });

      if (groupMode === "create") {
        const name = groupType === "couple"
          ? "Us"
          : groupName.trim();
        if (groupType === "group" && !name) {
          setError("Enter a group name to continue.");
          setSubmitting(false);
          return;
        }
        const code = generateInviteCode();
        const group = await createGroup({
          name,
          type: groupType,
          invite_code: code,
          created_by: uid,
        });
        await addGroupMember(group.id, uid, "owner");
        await upsertUser(uid, { active_group_id: group.id });
      } else {
        const code = inviteCode.trim().toUpperCase();
        if (code.length !== 6) {
          setError("Enter a valid 6-character invite code.");
          setSubmitting(false);
          return;
        }
        const group = await getGroupByInviteCode(code);
        if (!group) {
          setError("Group not found. Double-check the code.");
          setSubmitting(false);
          return;
        }
        await addGroupMember(group.id, uid, "member");
        await upsertUser(uid, { active_group_id: group.id });
      }

      await refreshProfile();
      router.replace("/home");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message :
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Something went wrong. Please try again.";
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-cream flex flex-col overflow-hidden" style={{ height: "100dvh" }}>
      {/* Progress bar */}
      <div className="h-[2px] bg-[rgba(44,40,32,0.07)] flex-shrink-0">
        <motion.div
          className="h-full bg-ink"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>

      <div
        className="flex-1 flex flex-col px-6 pt-5 min-h-0"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
      >
        <AnimatePresence mode="wait">

          {/* ── Step 1: Profile ─────────────────────────────────── */}
          {step === "profile" && (
            <motion.div
              key="profile"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="flex-1 flex flex-col justify-center gap-6 max-w-sm mx-auto w-full min-h-0">
                <div>
                  <p className="text-[10px] font-[600] uppercase tracking-[0.14em] text-ink3 mb-3">
                    1 of 3
                  </p>
                  <h2 className="font-display text-[34px] font-[300] tracking-[-1.5px] text-ink leading-[1.1]">
                    What should<br />we call you?
                  </h2>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <button onClick={() => fileRef.current?.click()} className="relative">
                    <div
                      className="w-[68px] h-[68px] rounded-full overflow-hidden flex items-center justify-center"
                      style={{ backgroundColor: accent + "30" }}
                    >
                      {photoUrl ? (
                        <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[24px] font-[300]" style={{ color: accent }}>
                          {displayName ? displayName[0].toUpperCase() : "?"}
                        </span>
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-ink flex items-center justify-center">
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M6 2.5V9.5M2.5 6H9.5" stroke="#F5F0E8" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  <p className="text-[11px] text-ink3">Tap to add a photo</p>
                </div>

                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  maxLength={40}
                  autoFocus
                  className="w-full bg-transparent border-b-[1.5px] border-[rgba(44,40,32,0.18)] focus:border-ink text-[24px] font-[300] tracking-[-0.5px] text-ink placeholder:text-ink3 pb-2 outline-none transition-colors"
                />
              </div>

              <button
                onClick={() => setStep("colour")}
                disabled={!displayName.trim()}
                className="w-full max-w-sm mx-auto bg-ink text-cream rounded-[18px] py-[16px] text-[15px] font-[500] transition-[opacity,transform] duration-150 ease-out active:scale-[0.97] active:opacity-75 disabled:opacity-25 disabled:active:scale-100 flex-shrink-0"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* ── Step 2: Colour ──────────────────────────────────── */}
          {step === "colour" && (
            <motion.div
              key="colour"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="flex-1 flex flex-col justify-center gap-6 max-w-sm mx-auto w-full min-h-0">
                <div>
                  <p className="text-[10px] font-[600] uppercase tracking-[0.14em] text-ink3 mb-3">
                    2 of 3
                  </p>
                  <h2 className="font-display text-[34px] font-[300] tracking-[-1.5px] text-ink leading-[1.1]">
                    Your colour
                  </h2>
                  <p className="text-[13px] text-ink3 mt-1.5">Your accent across the app.</p>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {SWATCHES.map(({ colour, name }) => (
                    <button
                      key={colour}
                      onClick={() => setAccent(colour)}
                      className="relative flex flex-col items-center gap-2 py-4 rounded-[18px] transition-all"
                      style={{
                        backgroundColor: accent === colour ? colour + "20" : "rgba(44,40,32,0.03)",
                        border: `1.5px solid ${accent === colour ? colour : "rgba(44,40,32,0.08)"}`,
                      }}
                    >
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: colour }} />
                      <span className="text-[11px] font-[500] text-ink3">{name}</span>
                      {accent === colour && (
                        <div
                          className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: colour }}
                        >
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 max-w-sm mx-auto w-full flex-shrink-0">
                <button
                  onClick={() => setStep("profile")}
                  className="flex-1 bg-[rgba(44,40,32,0.06)] text-ink rounded-[18px] py-[16px] text-[15px] font-[500] transition-opacity transition-[opacity,transform] duration-150 ease-out active:scale-[0.97] active:opacity-75"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep("group")}
                  className="flex-[2] bg-ink text-cream rounded-[18px] py-[16px] text-[15px] font-[500] transition-opacity transition-[opacity,transform] duration-150 ease-out active:scale-[0.97] active:opacity-75"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Group ───────────────────────────────────── */}
          {step === "group" && (
            <motion.div
              key="group"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="flex-1 flex flex-col justify-center gap-5 max-w-sm mx-auto w-full min-h-0">
                <div>
                  <p className="text-[10px] font-[600] uppercase tracking-[0.14em] text-ink3 mb-3">
                    3 of 3
                  </p>
                  <h2 className="font-display text-[34px] font-[300] tracking-[-1.5px] text-ink leading-[1.1]">
                    Your space
                  </h2>
                  <p className="text-[13px] text-ink3 mt-1.5">Create a group or join one with a code.</p>
                </div>

                <div className="flex p-1 rounded-[14px]" style={{ backgroundColor: "rgba(44,40,32,0.06)" }}>
                  {(["create", "join"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => { setGroupMode(mode); setError(""); }}
                      className="flex-1 py-2.5 rounded-[11px] text-[14px] font-[500] transition-all"
                      style={{
                        backgroundColor: groupMode === mode ? "white" : "transparent",
                        color: groupMode === mode ? "#2C2820" : "rgba(44,40,32,0.45)",
                        boxShadow: groupMode === mode ? "0 1px 3px rgba(44,40,32,0.08)" : "none",
                      }}
                    >
                      {mode === "create" ? "Create group" : "Join with code"}
                    </button>
                  ))}
                </div>

                {groupMode === "create" ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-[600] uppercase tracking-[0.12em] text-ink3">
                        Group type
                      </label>
                      <div className="flex gap-2">
                        {(["couple", "group"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => { setGroupType(t); setError(""); }}
                            className="flex-1 py-2.5 rounded-[14px] text-[14px] font-[500] border-[0.5px] transition-all"
                            style={{
                              backgroundColor: groupType === t ? "#2C2820" : "white",
                              color: groupType === t ? "#F5F0E8" : "rgba(44,40,32,0.6)",
                              borderColor: groupType === t ? "#2C2820" : "rgba(44,40,32,0.12)",
                              boxShadow: groupType === t ? "none" : "0 1px 3px rgba(44,40,32,0.04)",
                            }}
                          >
                            {t === "couple" ? "Couple (2)" : "Group (3–10)"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <AnimatePresence>
                      {groupType === "group" && (
                        <motion.div
                          key="group-name"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                          style={{ overflow: "hidden" }}
                        >
                          <div className="flex flex-col gap-1.5 pt-1">
                            <label className="text-[10px] font-[600] uppercase tracking-[0.12em] text-ink3">
                              Group name
                            </label>
                            <input
                              type="text"
                              value={groupName}
                              onChange={(e) => setGroupName(e.target.value)}
                              placeholder="e.g. The Fam, Our House"
                              maxLength={40}
                              className="w-full bg-white border-[0.5px] border-[rgba(44,40,32,0.12)] rounded-[14px] px-4 py-3 text-[15px] text-ink placeholder:text-ink3 outline-none focus:border-[rgba(44,40,32,0.3)]"
                              style={{ boxShadow: "0 1px 3px rgba(44,40,32,0.04)" }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-[600] uppercase tracking-[0.12em] text-ink3">
                      Invite code
                    </label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="XXXXXX"
                      maxLength={6}
                      className="w-full bg-white border-[0.5px] border-[rgba(44,40,32,0.12)] rounded-[14px] px-4 py-4 text-[24px] font-[300] tracking-[0.3em] text-ink placeholder:text-ink3 placeholder:tracking-[0.15em] outline-none focus:border-[rgba(44,40,32,0.3)] text-center uppercase"
                      style={{ boxShadow: "0 1px 3px rgba(44,40,32,0.04)" }}
                    />
                  </div>
                )}

                {error && (
                  <p className="text-[13px] text-red text-center -mt-1">{error}</p>
                )}
              </div>

              <div className="flex gap-3 max-w-sm mx-auto w-full flex-shrink-0">
                <button
                  onClick={() => setStep("colour")}
                  className="flex-1 bg-[rgba(44,40,32,0.06)] text-ink rounded-[18px] py-[16px] text-[15px] font-[500] transition-opacity transition-[opacity,transform] duration-150 ease-out active:scale-[0.97] active:opacity-75"
                >
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={submitting}
                  className="flex-[2] bg-ink text-cream rounded-[18px] py-[16px] text-[15px] font-[500] transition-[opacity,transform] duration-150 ease-out active:scale-[0.97] active:opacity-75 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
                >
                  {submitting ? (
                    <span className="w-5 h-5 rounded-full border-2 border-cream border-t-transparent animate-spin" />
                  ) : (
                    "Get started"
                  )}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
