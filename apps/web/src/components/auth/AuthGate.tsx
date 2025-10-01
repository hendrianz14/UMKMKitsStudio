"use client";

import { useEffect, useState } from "react";
import type { Route } from "next";
import { useParams, useRouter } from "next/navigation";

import { defaultLocale, isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

const SIGN_IN_ROUTES = {
  id: "/id/auth/login",
  en: "/en/auth/login"
} satisfies Record<Locale, `/${Locale}/auth/login`>;

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const { locale } = (useParams<{ locale?: string }>() ?? {}) as { locale?: string };
  const resolvedLocale = locale && isValidLocale(locale) ? (locale as Locale) : undefined;
  const signInPath: Route = resolvedLocale
    ? SIGN_IN_ROUTES[resolvedLocale]
    : (`/${defaultLocale}/auth/login` as Route);

  useEffect(() => {
    let unsubscribed = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (unsubscribed) return;
        const authed = Boolean(data.session);
        setIsAuthenticated(authed);
        if (!authed) {
          router.replace(signInPath);
        }
      })
      .catch((error) => {
        console.warn("[auth-gate] Failed to get session", error);
        if (!unsubscribed) {
          setIsAuthenticated(false);
          router.replace(signInPath);
        }
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      const authed = Boolean(session);
      setIsAuthenticated(authed);
      if (!authed) {
        router.replace(signInPath);
      }
    });

    return () => {
      unsubscribed = true;
      authListener.subscription.unsubscribe();
    };
  }, [router, signInPath, supabase]);

  if (isAuthenticated !== true) {
    return null;
  }

  return <>{children}</>;
}
