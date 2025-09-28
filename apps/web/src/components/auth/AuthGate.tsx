"use client";

import { useEffect, useState } from "react";
import { getClientApp } from "@/lib/firebase-client";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter, useParams } from "next/navigation";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const app = getClientApp();
  const router = useRouter();
  const { locale } = (useParams<{ locale?: string }>() ?? {}) as { locale?: string };

  useEffect(() => {
    const signInPath = locale ? `/${locale}/sign-in` : "/sign-in";
    if (!app) {
      setReady(false);
      router.replace(signInPath);
      return;
    }
    return onAuthStateChanged(getAuth(app), (user) => {
      if (!user) {
        setReady(false);
        router.replace(signInPath);
      } else {
        setReady(true);
      }
    });
  }, [app, router, locale]);

  if (!ready) return null;
  return <>{children}</>;
}
