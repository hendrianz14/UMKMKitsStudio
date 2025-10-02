import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export function supaServer(): SupabaseClient {
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- lazy import for client compatibility
  const { cookies, headers } = require("next/headers") as typeof import("next/headers");
  const cookieStore = cookies() as any;
  const hdrs = headers() as any;
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (k: string) => cookieStore.get(k)?.value,
        set: (k: string, v: string, opts?: Record<string, unknown>) =>
          cookieStore.set({ name: k, value: v, ...(opts ?? {}) }),
        remove: (k: string, opts?: Record<string, unknown>) =>
          cookieStore.set({ name: k, value: "", ...(opts ?? {}) }),
      },
      headers: { "x-forwarded-for": hdrs.get("x-forwarded-for") ?? "" },
    } as unknown as Parameters<typeof createServerClient>[2]
  ) as unknown as SupabaseClient;
}

