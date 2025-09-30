import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export type SupabaseServerClient = ReturnType<typeof createServerClient>;

export function supaServer(): SupabaseServerClient {
  const c = cookies() as unknown as {
    get: (name: string) => { value?: string } | undefined;
    set: (options: { name: string; value: string } & Record<string, unknown>) => void;
  };
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => c.get(name)?.value,
        set: (name, value, options) => c.set({ name, value, ...options }),
        remove: (name, options) =>
          c.set({ name, value: "", ...options, maxAge: 0 }),
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
