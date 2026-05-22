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

  // Step 1 — parse the hash tokens and hand them to the shared Supabase singleton.
  // This fires SIGNED_IN on that same singleton, which AuthContext is already
  // subscribed to, so AuthContext will update user+profile atomically.
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
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

  // Step 2 — hard timeout: if SIGNED_IN never fires within 12s, give up.
  useEffect(() => {
    const t = setTimeout(() => setFailed(true), 12_000);
    return () => clearTimeout(t);
  }, []);

  // Step 3 — navigate only once AuthContext has fully settled.
  // We intentionally ignore loading=false+user=null (that's just the transient
  // INITIAL_SESSION state). We only act when:
  //   a) failed=true  →  back to onboarding
  //   b) !loading && user  →  SIGNED_IN was processed AND profile is loaded
  useEffect(() => {
    if (failed) {
      router.replace("/onboarding");
      return;
    }
    if (loading || !user) return; // keep spinning
    router.replace(profileComplete ? "/home" : "/onboarding/setup");
  }, [failed, loading, user, profileComplete, router]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
}
