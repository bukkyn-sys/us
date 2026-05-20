"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/context/AuthContext";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { loading } = useAuthContext();

  useEffect(() => {
    if (!loading) {
      router.replace("/");
    }
  }, [loading, router]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
}
