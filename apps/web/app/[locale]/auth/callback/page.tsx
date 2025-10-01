"use client";

import { Suspense, useEffect } from "react";
import type { Route } from "next";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { supaBrowser } from "@/lib/supabase-browser";
import { defaultLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

async function waitForSession(sb: SupabaseClient, tries = 8, delay = 150) {
  for (let i = 0; i < tries; i++) {
    const {
      data: { session },
    } = await sb.auth.getSession();
    if (session) return session;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return null;
}

function Inner() {
  const router = useRouter();
  const search = useSearchParams();
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale || defaultLocale;

  useEffect(() => {
    void (async () => {
      const sb = supaBrowser();

      let session = await waitForSession(sb);
      if (!session) {
        const code = search.get("code");
        if (code) {
          try {
            const { error } = await sb.auth.exchangeCodeForSession(window.location.href);
            if (!error) {
              session = (await sb.auth.getSession()).data.session ?? null;
            }
          } catch {}
        }
      }

      if (!session) {
        router.replace(`/${locale}/auth/login` as Route);
        return;
      }

      try {
        await fetch("/api/auth/session-sync", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }),
        });
      } catch {}

      try {
        await fetch("/api/auth/oauth-bootstrap", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } catch {}

      const nextParam = search.get("next");
      const fallback = `/${locale}/dashboard`;
      const to: Route = nextParam && nextParam.startsWith("/")
        ? (nextParam as Route)
        : (fallback as Route);
      router.replace(to);
    })();
  }, [locale, router, search]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-pulse text-sm opacity-70">Menyambungkan akun…</div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-sm opacity-70">Membuka…</div>
        </div>
      }
    >
      <Inner />
    </Suspense>
  );
}
