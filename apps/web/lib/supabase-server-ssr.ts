import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type CookieStore = Awaited<ReturnType<typeof cookies>> & {
  set?: (options: any) => void;
};

export function supaServer() {
  const cookieStore = cookies() as unknown as CookieStore;
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set?.({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set?.({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}

export async function getServerUser() {
  const {
    data: { user },
  } = await supaServer().auth.getUser();
  return user;
}
