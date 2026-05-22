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

// Call this before any PostgREST operation to ensure the access token
// is injected into the REST client's headers.
export async function ensureAuth(): Promise<string | null> {
  const { data: { session } } = await getClient().auth.getSession();
  const token = session?.access_token ?? null;
  if (token) {
    // Access the internal rest client and update its auth header directly.
    const rest = (getClient() as unknown as { rest?: { setAuth: (t: string) => void } }).rest;
    rest?.setAuth(token);
  }
  return token;
}
