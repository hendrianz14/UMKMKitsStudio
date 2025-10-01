import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export function supaServer(): SupabaseClient {
  const c = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => c.get(n)?.value,
        set: (n, v, o) => c.set({ name: n, value: v, ...o }),
        remove: (n, o) => c.set({ name: n, value: "", ...o, maxAge: 0 }),
      },
    }
  );
}

export async function getServerUser() {
  const sb = supaServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user;
}
