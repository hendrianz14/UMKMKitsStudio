import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function supaBrowser(): SupabaseClient | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (browserClient) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error("[supabase-browser] Missing Supabase env vars in browser context.");
    return null;
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      storageKey: "umkmkits.supabase.auth",
    },
  });

  return browserClient;
}

export function resetSupaBrowserClient() {
  browserClient = null;
}
