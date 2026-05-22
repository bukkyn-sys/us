import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Store on globalThis so the singleton survives across Next.js module re-evaluations
const g = globalThis as typeof globalThis & { __supabase?: SupabaseClient };

function getClient(): SupabaseClient {
  if (!g.__supabase) {
    g.__supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: "implicit",
        },
      }
    );
  }
  return g.__supabase;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient();
    // Use Reflect.get with client as receiver so prototype getters see the real `this`.
    // Bind functions for the same reason.
    const value = Reflect.get(client, prop, client);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});

// Returns a Supabase client with the Authorization header explicitly set to
// the given access token. Use this for one-off writes where you need to
// guarantee the token reaches PostgREST regardless of session lock state.
export function createAuthedClient(accessToken: string): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }
  );
}
