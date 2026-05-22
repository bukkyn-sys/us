"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/context/AuthContext";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, loading, profileComplete } = useAuthContext();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 15_000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (timedOut) { router.replace("/onboarding"); return; }
    if (loading) return;
    router.replace(user
      ? (profileComplete ? "/home" : "/onboarding/setup")
      : "/onboarding"
    );
  }, [timedOut, loading, user, profileComplete, router]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
}
