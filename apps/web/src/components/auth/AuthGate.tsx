"use client";

import { useEffect, useState } from "react";
import { getClientApp } from "../../../lib/firebase-client";
import { isValidLocale } from "../../../lib/i18n";
import type { Locale } from "../../../lib/i18n";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter, useParams } from "next/navigation";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const app = getClientApp();
  const router = useRouter();
  const { locale } = (useParams<{ locale?: string }>() ?? {}) as { locale?: string };
  const resolvedLocale = locale && isValidLocale(locale) ? (locale as Locale) : undefined;
  const signInRoutes = {
    id: "/id/sign-in",
    en: "/en/sign-in"
  } satisfies Record<Locale, `/${Locale}/sign-in`>;
  const signInPath = resolvedLocale ? signInRoutes[resolvedLocale] : "/sign-in";

  useEffect(() => {
    const redirectToSignIn = () => router.replace(signInPath);

    if (!app) {
      setReady(false);
      redirectToSignIn();
      return;
    }
    return onAuthStateChanged(getAuth(app), (user) => {
      if (!user) {
        setReady(false);
        redirectToSignIn();
      } else {
        setReady(true);
      }
    });
  }, [app, router, signInPath]);

  if (!ready) return null;
  return <>{children}</>;
}
