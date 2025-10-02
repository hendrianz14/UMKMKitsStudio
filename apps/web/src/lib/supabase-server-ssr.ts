import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type {
  CookieMethodsServerDeprecated,
  CookieOptions,
} from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

type TypedSupabaseClient = SupabaseClient<any, any, any, any, any>;

export async function supaServer(): Promise<TypedSupabaseClient> {
  const cookieStore = await cookies();
  const hdrs = await headers();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const cookieMethods: CookieMethodsServerDeprecated = {
    get(name) {
      return cookieStore.get(name)?.value ?? null;
    },
    set(name, value, options) {
      if ("set" in cookieStore) {
        (cookieStore as unknown as {
          set: (args: { name: string; value: string } & CookieOptions) => void;
        }).set({ name, value, ...(options ?? {}) });
      }
    },
    remove(name, options) {
      if ("delete" in cookieStore) {
        (cookieStore as unknown as {
          delete: (name: string, options?: CookieOptions) => void;
        }).delete(name, options);
        return;
      }
      if ("set" in cookieStore) {
        (cookieStore as unknown as {
          set: (args: { name: string; value: string } & CookieOptions) => void;
        }).set({ name, value: "", ...(options ?? {}) });
      }
    },
  };

  return createServerClient(url, anon, {
    cookies: cookieMethods,
    global: {
      headers: {
        "x-forwarded-for": hdrs.get("x-forwarded-for") ?? "",
      },
    },
  });
}

export async function getServerUser() {
  const sb = await supaServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user;
}
