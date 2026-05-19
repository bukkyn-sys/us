"use client";
export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/ui/BottomNav";
import { useAuthContext } from "@/lib/context/AuthContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, profileComplete } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/onboarding");
    else if (!profileComplete) router.replace("/onboarding/setup");
  }, [user, loading, profileComplete, router]);

  if (loading || !user || !profileComplete) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <main className="pb-[calc(56px+env(safe-area-inset-bottom,0px))]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
