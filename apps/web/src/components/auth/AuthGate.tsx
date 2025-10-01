"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { defaultLocale, isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

type RouterReplaceArg = Parameters<ReturnType<typeof useRouter>["replace"]>[0];

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const { locale } = (useParams<{ locale?: string }>() ?? {}) as { locale?: string };
  const resolvedLocale = locale && isValidLocale(locale) ? (locale as Locale) : undefined;
  const finalLocale: Locale = resolvedLocale ?? defaultLocale;
  const signInHref = useMemo(
    () => ({
      pathname: "/[locale]/auth/login",
      params: { locale: finalLocale }
    }) as const,
    [finalLocale]
  );

  useEffect(() => {
    let unsubscribed = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (unsubscribed) return;
        const authed = Boolean(data.session);
        setIsAuthenticated(authed);
        if (!authed) {
          router.replace(signInHref as unknown as RouterReplaceArg);
        }
      })
      .catch((error) => {
        console.warn("[auth-gate] Failed to get session", error);
        if (!unsubscribed) {
          setIsAuthenticated(false);
          router.replace(signInHref as unknown as RouterReplaceArg);
        }
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      const authed = Boolean(session);
      setIsAuthenticated(authed);
      if (!authed) {
        router.replace(signInHref as unknown as RouterReplaceArg);
      }
    });

    return () => {
      unsubscribed = true;
      authListener.subscription.unsubscribe();
    };
  }, [router, signInHref, supabase]);

  if (isAuthenticated !== true) {
    return null;
  }

  return <>{children}</>;
}
