import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SupabaseBrowserClient = SupabaseClient<any, any, any>;

let _client: SupabaseBrowserClient | null = null;

export function supaBrowser(): SupabaseBrowserClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) throw new Error("[supabase-browser] Missing NEXT_PUBLIC_SUPABASE_*");

  _client = createBrowserClient(url, anon, {
    auth: {
      flowType: "pkce",
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
    },
  }) as unknown as SupabaseBrowserClient;

  return _client;
}

export function resetSupaBrowserClient() {
  _client = null;
}
