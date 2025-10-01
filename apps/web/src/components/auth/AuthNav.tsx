"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { defaultLocale, isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

const DASHBOARD_ROUTES = {
  id: "/id/dashboard",
  en: "/en/dashboard",
} satisfies Record<Locale, `/${Locale}/dashboard`>;

const SIGN_IN_ROUTES = {
  id: "/id/auth/login",
  en: "/en/auth/login",
} satisfies Record<Locale, `/${Locale}/auth/login`>;

const SIGN_UP_ROUTES = {
  id: "/id/auth/signup",
  en: "/en/auth/signup",
} satisfies Record<Locale, `/${Locale}/auth/signup`>;

const AUTH_ROUTE_SEGMENTS = [
  "/auth/login",
  "/auth/signup",
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
  const supabase = getSupabaseBrowserClient();
  const { locale } = (useParams<{ locale?: string }>() ?? {}) as { locale?: string };
  const pathname = usePathname();
  const activeLocale = locale && isValidLocale(locale) ? (locale as Locale) : fallbackLocale;
  const fallback = defaultLocale;
  const dashboardHref = activeLocale
    ? DASHBOARD_ROUTES[activeLocale]
    : (`/${fallback}/dashboard` as Route);
  const signInHref = activeLocale
    ? SIGN_IN_ROUTES[activeLocale]
    : (`/${fallback}/auth/login` as Route);
  const signUpHref = activeLocale
    ? SIGN_UP_ROUTES[activeLocale]
    : (`/${fallback}/auth/signup` as Route);

  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        setAuthState(data.session ? "authenticated" : "guest");
      })
      .catch((error) => {
        console.warn("[auth-nav] Failed to get session", error);
        if (!cancelled) setAuthState("guest");
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setAuthState(session ? "authenticated" : "guest");
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

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
    return null;
  }

  const handleNavigate = () => {
    onNavigate?.();
  };

  const handleSignOut = () => {
    handleNavigate();
    void supabase.auth.signOut();
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
