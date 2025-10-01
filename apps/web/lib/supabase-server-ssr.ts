import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

type TypedSupabaseClient = SupabaseClient<any, any, any, any, any>;

export async function supaServer(): Promise<TypedSupabaseClient> {
  const c = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          c.getAll().map((cookie) => ({ name: cookie.name, value: cookie.value })),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            c.set({ name, value, ...options });
          });
        },
      },
    }
  );
}

export async function getServerUser() {
  const sb = await supaServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user;
}
