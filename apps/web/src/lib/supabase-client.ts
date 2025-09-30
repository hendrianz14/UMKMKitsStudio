import type { Session } from "@supabase/supabase-js";

import {
  type SupabaseBrowserClient,
  resetSupaBrowserClient,
  supaBrowser,
} from "@/lib/supabase-browser";

export function getSupabaseBrowserClient(): SupabaseBrowserClient {
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
