"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/context/AuthContext";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user } = useAuthContext();

  // Redirect as soon as the session arrives
  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  // Fallback: if no session after 10s, send to onboarding
  useEffect(() => {
    const t = setTimeout(() => router.replace("/onboarding"), 10000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
}
