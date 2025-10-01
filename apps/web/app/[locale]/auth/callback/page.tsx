"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { supaBrowser } from "@/lib/supabase-browser";
import { defaultLocale, isValidLocale, type Locale } from "@/lib/i18n";

type RouterReplaceArg = Parameters<ReturnType<typeof useRouter>["replace"]>[0];

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
  const locale = params?.locale;
  const resolvedLocale = useMemo<Locale>(() => {
    if (locale && isValidLocale(locale)) {
      return locale as Locale;
    }
    return defaultLocale;
  }, [locale]);
  const signInHref = useMemo(
    () => ({ pathname: "/[locale]/auth/login", params: { locale: resolvedLocale } }) as const,
    [resolvedLocale]
  );
  const dashboardHref = useMemo(
    () => ({ pathname: "/[locale]/dashboard", params: { locale: resolvedLocale } }) as const,
    [resolvedLocale]
  );

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
        router.replace(signInHref as unknown as RouterReplaceArg);
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
      const fallback = `/${resolvedLocale}/dashboard`;
      const to = nextParam && nextParam.startsWith("/") ? nextParam : fallback;
      if (to === fallback) {
        router.replace(dashboardHref as unknown as RouterReplaceArg);
        return;
      }

      try {
        const url = new URL(to, window.location.origin);
        const [localeSegment, ...rest] = url.pathname.split("/").filter(Boolean);
        if (localeSegment && isValidLocale(localeSegment)) {
          const targetLocale = localeSegment as Locale;
          if (rest.length === 1 && rest[0] === "dashboard") {
            router.replace(
              { pathname: "/[locale]/dashboard", params: { locale: targetLocale } } as unknown as RouterReplaceArg
            );
            return;
          }
          if (rest.length === 1 && rest[0] === "onboarding") {
            router.replace(
              { pathname: "/[locale]/onboarding", params: { locale: targetLocale } } as unknown as RouterReplaceArg
            );
            return;
          }
        }
      } catch {}

      router.replace(dashboardHref as unknown as RouterReplaceArg);
    })();
  }, [dashboardHref, resolvedLocale, router, search, signInHref]);

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
