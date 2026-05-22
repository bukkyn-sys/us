"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "@/lib/context/AuthContext";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, loading, profileComplete } = useAuthContext();
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const hash = window.location.hash;

    // Supabase error response (e.g. failed token exchange with Google)
    if (hash.includes("error=")) {
      setFailed(true);
      return;
    }

    const params = new URLSearchParams(hash.slice(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      setFailed(true);
      return;
    }

    supabase.auth
      .setSession({ access_token, refresh_token })
      .then(({ error }) => { if (error) setFailed(true); })
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setFailed(true), 12_000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (failed) { router.replace("/onboarding"); return; }
    if (loading || !user) return;
    router.replace(profileComplete ? "/home" : "/onboarding/setup");
  }, [failed, loading, user, profileComplete, router]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
}
