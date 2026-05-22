"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

export default function RootPage() {
  const { user, loading, profileComplete } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Supabase may redirect OAuth tokens to the site root instead of /auth/callback
    // (happens when the callback URL isn't in Supabase's allowed redirect list).
    // Hard-redirect so the hash survives the navigation.
    if (window.location.hash.includes("access_token")) {
      window.location.replace("/auth/callback" + window.location.hash);
      return;
    }
    if (loading) return;
    if (!user) router.replace("/onboarding");
    else if (!profileComplete) router.replace("/onboarding/setup");
    else router.replace("/home");
  }, [user, loading, profileComplete, router]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
}
