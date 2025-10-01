import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { CookieMethodsServerDeprecated } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseServerClient = SupabaseClient<any, any, any>;

export function supaServer(): SupabaseServerClient {
  const cookieStore = cookies();
  const c = cookieStore as unknown as Awaited<ReturnType<typeof cookies>>;
  const cookieMethods: CookieMethodsServerDeprecated = {
    get: (name) => c.get(name)?.value,
    set: (name, value, options) => {
      c.set({ name, value, ...options });
    },
    remove: (name, options) => {
      c.set({ name, value: "", ...options, maxAge: 0 });
    },
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {

      cookies: cookieMethods,
    }
  ) as SupabaseServerClient;

}

export async function getServerUser() {
  const sb = supaServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user;
}
