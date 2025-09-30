import type { Session, SupabaseClient } from "@supabase/supabase-js";

import { resetSupaBrowserClient, supaBrowser } from "@/lib/supabase-browser";

export function getSupabaseBrowserClient(): SupabaseClient {
  return supaBrowser();
}

export async function getSupabaseSession(): Promise<Session | null> {
  const client = getSupabaseBrowserClient();
  const { data, error } = await client.auth.getSession();
  if (error) {
    console.warn("[supabase-client] Failed to retrieve session", error.message);
    return null;
  }
  return data.session ?? null;
}

export { resetSupaBrowserClient };
