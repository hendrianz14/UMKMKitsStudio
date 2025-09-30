import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function supaBrowser(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) throw new Error("[supabase-browser] Missing NEXT_PUBLIC_SUPABASE_*");

  _client = createBrowserClient(url, anon, {
    cookies: {
      get(name) {
        return document.cookie
          .split("; ")
          .find((value) => value.startsWith(`${name}=`))?.split("=")[1];
      },
      set(name, value, options) {
        document.cookie = `${name}=${value}; Path=/; Max-Age=${options?.maxAge ?? 60 * 60 * 24 * 365}; SameSite=${options?.sameSite ?? "Lax"}; ${
          location.protocol === "https:" ? "Secure" : ""
        }`;
      },
      remove(name, options) {
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=${options?.sameSite ?? "Lax"}; ${
          location.protocol === "https:" ? "Secure" : ""
        }`;
      },
    },
    auth: { persistSession: true, detectSessionInUrl: true, autoRefreshToken: true },
  });

  return _client;
}

export function resetSupaBrowserClient() {
  _client = null;
}
