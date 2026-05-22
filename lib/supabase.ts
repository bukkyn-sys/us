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

// Returns the current access token. In v2.106+, the PostgREST client fetches
// the token dynamically on each request, so this is only needed for explicit
// auth checks (e.g. verifying a session exists before a DB write).
export async function ensureAuth(): Promise<string | null> {
  const { data: { session } } = await getClient().auth.getSession();
  return session?.access_token ?? null;
}
