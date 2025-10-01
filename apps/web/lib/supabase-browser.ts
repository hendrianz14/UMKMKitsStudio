import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SupabaseBrowserClient = SupabaseClient<any, any, any>;

let _client: SupabaseBrowserClient | null = null;

export function supaBrowser(): SupabaseBrowserClient {
  if (_client) return _client;
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true, autoRefreshToken: true } }
  );
  return _client;
}
export function resetSupaBrowserClient(){ _client = null; }

