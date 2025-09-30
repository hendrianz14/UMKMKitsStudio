import {
  type SupabaseBrowserClient,
  resetSupaBrowserClient,
  supaBrowser,
} from "@/lib/supabase-browser";

export function getSupabaseBrowserClient(): SupabaseBrowserClient {
  return supaBrowser();
}

export { resetSupaBrowserClient };
