"use client";

// Thin re-export — AuthContext is the primary source of auth state.
// This hook exists for backwards compat and convenience.
export { useAuthContext as useAuth } from "@/lib/context/AuthContext";
