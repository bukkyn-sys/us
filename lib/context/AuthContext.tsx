"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { onAuthChange } from "../auth";
import { getUser, upsertUser, type UserRow } from "../db";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserRow | null;
  loading: boolean;
  profileComplete: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  profileComplete: false,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(u: User) {
    try {
      let p = await getUser(u.id);
      if (!p) {
        const meta = u.user_metadata;
        await upsertUser(u.id, {
          display_name: meta?.full_name || meta?.name || u.email || "",
          photo_url: meta?.avatar_url || meta?.picture || null,
          accent_colour: "#C4A882",
          active_group_id: null,
        });
        p = await getUser(u.id);
      }
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }

  async function refreshProfile() {
    if (user) await loadProfile(user);
  }

  useEffect(() => {
    return onAuthChange(async (_event, sess) => {
      setSession(sess);
      const u = sess?.user ?? null;
      setUser(u);
      if (u) {
        await loadProfile(u);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const profileComplete =
    !!profile &&
    !!profile.display_name &&
    !!profile.accent_colour &&
    !!profile.active_group_id;

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, profileComplete, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
