import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function supaServer(): SupabaseClient {
  const cookieStore = cookies() as any;
  const hdrs = headers() as any;
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (k: string) => cookieStore.get(k)?.value,
        set: (k: string, v: string, opts?: Record<string, any>) =>
          cookieStore.set({ name: k, value: v, ...(opts ?? {}) }),
        remove: (k: string, opts?: Record<string, any>) =>
          cookieStore.set({ name: k, value: "", ...(opts ?? {}) }),
      },
      headers: { "x-forwarded-for": hdrs.get("x-forwarded-for") ?? "" },
    } as any
  ) as unknown as SupabaseClient;
}

let browserClient: SupabaseClient | null = null;
export function supaBrowser(): SupabaseClient {
  if (browserClient) return browserClient;
  browserClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: true, storageKey: "umkmkits.supabase.auth" } }
  ) as unknown as SupabaseClient;
  return browserClient;
}
