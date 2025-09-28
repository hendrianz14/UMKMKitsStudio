"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { getClientApp } from "@/lib/firebase-client";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { cn } from "@/lib/utils";
import { isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

const DASHBOARD_ROUTES = {
  id: "/id/dashboard",
  en: "/en/dashboard",
} satisfies Record<Locale, `/${Locale}/dashboard`>;

const SIGN_IN_ROUTES = {
  id: "/id/sign-in",
  en: "/en/sign-in",
} satisfies Record<Locale, `/${Locale}/sign-in`>;

const SIGN_UP_ROUTES = {
  id: "/id/sign-up",
  en: "/en/sign-up",
} satisfies Record<Locale, `/${Locale}/sign-up`>;

const AUTH_ROUTE_SEGMENTS = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/auth/action",
] as const;

type AuthState = "guest" | "authenticated";

type AuthNavProps = {
  layout?: "row" | "column";
  className?: string;
  onNavigate?: () => void;
  fallbackLocale?: Locale;
};

export default function AuthNav({
  layout = "row",
  className,
  onNavigate,
  fallbackLocale
}: AuthNavProps) {
  const [authState, setAuthState] = useState<AuthState>("guest");
  const app = getClientApp();
  const { locale } = (useParams<{ locale?: string }>() ?? {}) as { locale?: string };
  const pathname = usePathname();
  const activeLocale = locale && isValidLocale(locale) ? (locale as Locale) : fallbackLocale;
  const dashboardHref = activeLocale ? DASHBOARD_ROUTES[activeLocale] : "/dashboard";
  const signInHref = activeLocale ? SIGN_IN_ROUTES[activeLocale] : "/sign-in";
  const signUpHref = activeLocale ? SIGN_UP_ROUTES[activeLocale] : "/sign-up";

  useEffect(() => {
    if (!app) {
      setAuthState("guest");
      return;
    }

    const auth = getAuth(app);
    return onAuthStateChanged(auth, (user) => {
      setAuthState(user ? "authenticated" : "guest");
    });
  }, [app]);

  const isLoggedIn = authState === "authenticated";
  const containerClasses =
    layout === "column"
      ? "flex flex-col gap-3 w-full"
      : "flex items-center gap-2";
  const actionBaseClass = cn(
    "inline-flex items-center justify-center rounded-xl px-3",
    layout === "column" ? "h-11 w-full" : "h-9"
  );
  const shouldHideActions =
    typeof pathname === "string" &&
    AUTH_ROUTE_SEGMENTS.some((segment) => pathname.includes(segment));

  if (shouldHideActions) {
    return <div className={cn(containerClasses, className)} />;
  }

  const handleNavigate = () => {
    onNavigate?.();
  };

  const handleSignOut = () => {
    handleNavigate();
    if (app) {
      void signOut(getAuth(app));
    }
  };

  return (
    <div className={cn(containerClasses, className)}>
      {isLoggedIn ? (
        <>
          {pathname !== dashboardHref && (
            <Link
              href={dashboardHref}
              className={cn(actionBaseClass, "bg-card/30 border border-border hover:bg-card/50")}
              onClick={handleNavigate}
            >
              Dashboard
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className={cn(actionBaseClass, "bg-card/20 border border-border hover:bg-card/40")}
          >
            Keluar
          </button>
        </>
      ) : (
        <>
          <Link
            href={signInHref}
            className={cn(actionBaseClass, "bg-card/30 border border-border hover:bg-card/50")}
            onClick={handleNavigate}
          >
            Masuk
          </Link>
          <Link
            href={signUpHref}
            className={cn(actionBaseClass, "bg-primary text-primary-foreground hover:bg-primary/90")}
            onClick={handleNavigate}
          >
            Coba Gratis
          </Link>
        </>
      )}
    </div>
  );
}
