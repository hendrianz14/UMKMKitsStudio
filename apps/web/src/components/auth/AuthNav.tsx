"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { getClientApp } from "@/lib/firebase-client";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { cn } from "@/lib/utils";

type AuthNavProps = {
  layout?: "row" | "column";
  className?: string;
  onNavigate?: () => void;
  fallbackLocale?: string;
};

export default function AuthNav({
  layout = "row",
  className,
  onNavigate,
  fallbackLocale
}: AuthNavProps) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const app = getClientApp();
  const { locale } = (useParams<{ locale?: string }>() ?? {}) as { locale?: string };
  const pathname = usePathname();
  const base = locale ? `/${locale}` : fallbackLocale ? `/${fallbackLocale}` : "";

  useEffect(() => {
    if (!app) {
      setAuthed(false);
      return;
    }
    return onAuthStateChanged(getAuth(app), (u) => setAuthed(!!u));
  }, [app]);

  const isLoggedIn = !!authed;
  const containerClasses =
    layout === "column"
      ? "flex flex-col gap-3 w-full"
      : "flex items-center gap-2";
  const actionBaseClass = cn(
    "inline-flex items-center justify-center rounded-xl px-3",
    layout === "column" ? "h-11 w-full" : "h-9"
  );

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
          {pathname !== `${base}/dashboard` && (
            <Link
              href={`${base}/dashboard`}
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
            href={`${base}/sign-in`}
            className={cn(actionBaseClass, "bg-card/30 border border-border hover:bg-card/50")}
            onClick={handleNavigate}
          >
            Masuk
          </Link>
          <Link
            href={`${base}/sign-up`}
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
