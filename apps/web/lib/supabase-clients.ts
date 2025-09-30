import type { SupabaseClient } from "@supabase/supabase-js";
import { resetSupaBrowserClient, supaBrowser } from "@/lib/supabase-browser";

export function getSupabaseBrowserClient(): SupabaseClient {
  return supaBrowser();
}

export { resetSupaBrowserClient };
