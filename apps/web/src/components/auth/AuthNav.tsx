"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { SESSION_COOKIE_NAME } from "lib/session-constants";
import { cn } from "@/lib/utils";

const AUTH_ROUTE_SEGMENTS = ["/login", "/otp"] as const;

type AuthState = "guest" | "authenticated";

type AuthNavProps = {
  layout?: "row" | "column";
  className?: string;
  onNavigate?: () => void;
  fallbackLocale?: string;
};

function hasSessionCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`));
}

export default function AuthNav({
  layout = "row",
  className,
  onNavigate,
}: AuthNavProps) {
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>(() => (hasSessionCookie() ? "authenticated" : "guest"));

  useEffect(() => {
    const update = () => {
      setAuthState(hasSessionCookie() ? "authenticated" : "guest");
    };
    update();

    const interval = setInterval(update, 3000);
    window.addEventListener("focus", update);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", update);
    };
  }, []);

  const isLoggedIn = authState === "authenticated";
  const containerClasses = layout === "column" ? "flex flex-col gap-3 w-full" : "flex items-center gap-2";
  const actionBaseClass = cn(
    "inline-flex items-center justify-center rounded-xl px-3",
    layout === "column" ? "h-11 w-full" : "h-9"
  );

  const shouldHideActions = useMemo(
    () => typeof pathname === "string" && AUTH_ROUTE_SEGMENTS.some((segment) => pathname.includes(segment)),
    [pathname]
  );

  const handleNavigate = () => {
    onNavigate?.();
  };

  const handleSignOut = async () => {
    handleNavigate();
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setAuthState("guest");
    }
  };

  if (shouldHideActions) {
    return null;
  }

  return (
    <div className={cn(containerClasses, className)}>
      {isLoggedIn ? (
        <>
          {pathname !== "/dashboard" && (
            <Link
              href="/dashboard"
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
            href="/login"
            className={cn(actionBaseClass, "bg-card/30 border border-border hover:bg-card/50")}
            onClick={handleNavigate}
          >
            Masuk
          </Link>
          <Link
            href="/login"
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
