import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SupabaseBrowserClient = SupabaseClient<any, any, any>;

let _client: SupabaseBrowserClient | null = null;

function getDocumentCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((value) => value.startsWith(`${name}=`))
    ?.split("=")[1];
}

function setDocumentCookie(name: string, value: string, options?: { maxAge?: number; sameSite?: string }) {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const maxAge = options?.maxAge ?? 31536000;
  const sameSite = options?.sameSite ?? "Lax";
  const secure = window.location.protocol === "https:" ? "Secure" : "";
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=${sameSite}; ${secure}`.trim();
}

function removeDocumentCookie(name: string, options?: { sameSite?: string }) {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const sameSite = options?.sameSite ?? "Lax";
  const secure = window.location.protocol === "https:" ? "Secure" : "";
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=${sameSite}; ${secure}`.trim();
}

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
    cookies: {
      get: (name) => getDocumentCookie(name),
      set: (name, value, options) => setDocumentCookie(name, value, options),
      remove: (name, options) => removeDocumentCookie(name, options),
    },
  }) as SupabaseBrowserClient;

  return _client;
}

export function resetSupaBrowserClient() {
  _client = null;
}
