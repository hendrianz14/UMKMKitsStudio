"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";

import { getClientApp } from "@/lib/firebase-client";
import { isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

const SIGN_IN_ROUTES = {
  id: "/id/sign-in",
  en: "/en/sign-in"
} satisfies Record<Locale, `/${Locale}/sign-in`>;

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const app = getClientApp();
  const router = useRouter();
  const { locale } = (useParams<{ locale?: string }>() ?? {}) as { locale?: string };
  const resolvedLocale = locale && isValidLocale(locale) ? (locale as Locale) : undefined;
  const signInPath = resolvedLocale ? SIGN_IN_ROUTES[resolvedLocale] : "/sign-in";

  useEffect(() => {
    if (!app) {
      setIsAuthenticated(false);
      router.replace(signInPath);
      return;
    }

    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const authed = !!user;
      setIsAuthenticated(authed);
      if (!authed) {
        router.replace(signInPath);
      }
    });

    return () => unsubscribe();
  }, [app, router, signInPath]);

  if (isAuthenticated !== true) {
    return null;
  }

  return <>{children}</>;
}
