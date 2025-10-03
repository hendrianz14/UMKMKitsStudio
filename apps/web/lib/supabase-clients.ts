import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables"
  );
}

const SUPABASE_URL = supabaseUrl;
const SUPABASE_ANON_KEY = supabaseAnonKey;

export type SupabaseServerAccess = "readonly" | "readwrite";

type CookieStore = {
  get(name: string): { value: string } | undefined;
};

type CookieStoreWithSet = CookieStore & {
  set: (args: { name: string; value: string } & CookieOptions) => void;
};

type CookieStoreWithDelete = CookieStore & {
  delete: (name: string, options?: CookieOptions) => void;
};

type HeaderStore = {
  get(name: string): string | null | undefined;
};

function hasSet(store: CookieStore): store is CookieStoreWithSet {
  return typeof (store as CookieStoreWithSet | undefined)?.set === "function";
}

function hasDelete(store: CookieStore): store is CookieStoreWithDelete {
  return typeof (store as CookieStoreWithDelete | undefined)?.delete === "function";
}

function createCookieAdapter(store: CookieStore, access: SupabaseServerAccess) {
  return {
    get(name: string) {
      return store.get(name)?.value ?? null;
    },
    set(name: string, value: string, options?: CookieOptions) {
      if (access !== "readwrite" || !hasSet(store)) return;
      store.set({ name, value, ...(options ?? {}) });
    },
    remove(name: string, options?: CookieOptions) {
      if (access !== "readwrite") return;
      if (hasDelete(store)) {
        store.delete(name, options);
        return;
      }
      if (hasSet(store)) {
        store.set({ name, value: "", ...(options ?? {}) });
      }
    },
  };
}

function resolveRequestStores() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- required for Next.js RSC bundling
  const { cookies, headers } = require("next/headers") as typeof import("next/headers");
  return { cookies: cookies(), headers: headers() };
}

export type SupabaseServerClient = SupabaseClient;
export type SupabaseBrowserClient = SupabaseClient;

export function supaServer(
  access: SupabaseServerAccess = "readonly"
): SupabaseServerClient {
  const { cookies: cookieStore, headers: headerStore } = resolveRequestStores();
  const cookies = createCookieAdapter(cookieStore as unknown as CookieStore, access);

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies,
    global: {
      headers: {
        "x-forwarded-for": (headerStore as unknown as HeaderStore).get("x-forwarded-for") ?? "",
      },
    },
  }) as unknown as SupabaseServerClient;
}

declare global {
  // eslint-disable-next-line no-var
  var __kitstudio_supabase_browser__: SupabaseBrowserClient | undefined;
}

export function getSupabaseBrowserClient(): SupabaseBrowserClient {
  if (typeof window === "undefined") {
    throw new Error(
      "getSupabaseBrowserClient can only be used in a browser environment"
    );
  }

  if (!globalThis.__kitstudio_supabase_browser__) {
    globalThis.__kitstudio_supabase_browser__ = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          storageKey: "kitstudio-auth",
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }

  return globalThis.__kitstudio_supabase_browser__;
}
