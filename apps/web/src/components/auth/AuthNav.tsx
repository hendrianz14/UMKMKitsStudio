"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { defaultLocale, isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

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
  const supabase = getSupabaseBrowserClient();
  const { locale } = (useParams<{ locale?: string }>() ?? {}) as { locale?: string };
  const pathname = usePathname();
  const activeLocale = locale && isValidLocale(locale) ? (locale as Locale) : fallbackLocale;
  const fallback = defaultLocale;
  const finalLocale: Locale = activeLocale ?? fallback;
  const dashboardHref = useMemo(
    () => ({
      pathname: "/[locale]/dashboard",
      params: { locale: finalLocale }
    }) as const,
    [finalLocale]
  );
  const signInHref = useMemo(
    () => ({
      pathname: "/[locale]/sign-in",
      params: { locale: finalLocale }
    }) as const,
    [finalLocale]
  );
  const signUpHref = useMemo(
    () => ({
      pathname: "/[locale]/sign-up",
      params: { locale: finalLocale }
    }) as const,
    [finalLocale]
  );
  const dashboardPathname = `/${finalLocale}/dashboard`;

  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        if (cancelled) return;
        setAuthState(data.session ? "authenticated" : "guest");
      })
      .catch((error: any) => {
        console.warn("[auth-nav] Failed to get session", error);
        if (!cancelled) setAuthState("guest");
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setAuthState(session ? "authenticated" : "guest");
      }
    );

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
          {pathname !== dashboardPathname && (
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
