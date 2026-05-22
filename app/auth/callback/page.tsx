"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "@/lib/context/AuthContext";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, loading, profileComplete } = useAuthContext();
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState("Starting…");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const hash = window.location.hash;
    const search = window.location.search;
    setStatus(`hash=${hash.slice(0, 60)} search=${search}`);

    const params = new URLSearchParams(hash.slice(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      setStatus(`No tokens. hash="${hash}" search="${search}"`);
      setTimeout(() => setFailed(true), 4000);
      return;
    }

    setStatus("Tokens found, calling setSession…");
    supabase.auth
      .setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) {
          setStatus(`setSession error: ${error.message}`);
          setTimeout(() => setFailed(true), 4000);
        } else {
          setStatus("setSession OK, waiting for AuthContext…");
        }
      })
      .catch((e) => {
        setStatus(`setSession threw: ${String(e)}`);
        setTimeout(() => setFailed(true), 4000);
      });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setStatus((s) => `Timeout after 12s. Last: ${s}`);
      setFailed(true);
    }, 12_000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (failed) { router.replace("/onboarding"); return; }
    if (loading || !user) return;
    router.replace(profileComplete ? "/home" : "/onboarding/setup");
  }, [failed, loading, user, profileComplete, router]);

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4 px-6">
      <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      <p className="text-[11px] text-ink3 text-center max-w-xs break-all">{status}</p>
    </div>
  );
}
