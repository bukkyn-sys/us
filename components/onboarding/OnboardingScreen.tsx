"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signInWithGoogle } from "@/lib/auth";
import { useAuthContext } from "@/lib/context/AuthContext";

export function OnboardingScreen() {
  const { user, loading, profileComplete } = useAuthContext();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (window.location.hash.includes("access_token")) {
      window.location.replace("/auth/callback" + window.location.hash);
      return;
    }
    if (loading) return;
    if (user && profileComplete) router.replace("/home");
    else if (user && !profileComplete) router.replace("/onboarding/setup");
  }, [user, loading, profileComplete, router]);

  async function handleSignIn() {
    setSigningIn(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch {
      setError("Sign-in failed. Please try again.");
      setSigningIn(false);
    }
  }

  return (
    <div
      className="bg-cream flex flex-col overflow-hidden"
      style={{ height: "100dvh" }}
    >
      {/* Centred hero */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex-1 flex flex-col items-center justify-center text-center px-8"
      >
        <h1
          className="font-display font-[300] text-ink leading-none"
          style={{ fontSize: "clamp(80px, 24vw, 120px)", letterSpacing: "-3px" }}
        >
          us.
        </h1>
        <p
          className="font-display font-[300] text-ink2 leading-snug mt-4"
          style={{ fontSize: "clamp(18px, 5vw, 24px)", letterSpacing: "-0.4px" }}
        >
          for the people<br />who matter most.
        </p>
      </motion.div>

      {/* Bottom actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="px-6 flex flex-col gap-3 flex-shrink-0"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 48px)" }}
      >
        {error && (
          <p className="text-[13px] text-red text-center">{error}</p>
        )}
        <button
          onClick={handleSignIn}
          disabled={signingIn}
          className="w-full flex items-center justify-center gap-3 bg-card text-ink border-[0.5px] border-[rgba(44,40,32,0.10)] rounded-[18px] px-5 py-[17px] text-[15px] font-[500] transition-opacity active:opacity-60 disabled:opacity-40"
          style={{ boxShadow: "0 1px 4px rgba(44,40,32,0.07)" }}
        >
          {!signingIn ? (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          ) : (
            <span className="w-5 h-5 rounded-full border-2 border-ink border-t-transparent animate-spin" />
          )}
        </button>
        <p className="text-[11px] text-ink3 text-center leading-relaxed">
          By continuing you agree to our Terms &amp; Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}
