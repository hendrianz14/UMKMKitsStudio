import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function supaBrowser(): SupabaseClient {
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
    cookies: {
      get: (name) =>
        document.cookie
          .split("; ")
          .find((value) => value.startsWith(`${name}=`))?.split("=")[1],
      set: (name, value, options) => {
        document.cookie = `${name}=${value}; Path=/; Max-Age=${options?.maxAge ?? 31536000}; SameSite=${options?.sameSite ?? "Lax"}; ${
          location.protocol === "https:" ? "Secure" : ""
        }`;
      },
      remove: (name, options) => {
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=${options?.sameSite ?? "Lax"}; ${
          location.protocol === "https:" ? "Secure" : ""
        }`;
      },
    },
  });

  return _client;
}

export function resetSupaBrowserClient() {
  _client = null;
}
