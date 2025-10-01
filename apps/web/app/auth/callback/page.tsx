"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { supaBrowser } from "@/lib/supabase-browser";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Route as NextRoute } from "next";

export const dynamic = "force-dynamic";

function Inner() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    (async () => {
      const sb: SupabaseClient = supaBrowser();

      const code = search.get("code");
      if (code) {

        const { error } = await sb.auth.exchangeCodeForSession(window.location.href);

        if (error) {
          console.error("PKCE exchange:", error);
          router.replace("/login?error=oauth" as unknown as NextRoute);
          return;
        }


      const {
        data: { session },

      } = await sb.auth.getSession();
      if (!session) {
        router.replace("/login" as NextRoute);
        return;
      }

      try {
        await fetch("/api/auth/oauth-bootstrap", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } catch {}

      const raw = search.get("redirect");
      const to: NextRoute =
        raw && raw.startsWith("/") ? (raw as NextRoute) : ("/dashboard" as NextRoute);
eplace(to);
    })();
  }, [router, search]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-pulse text-sm opacity-70">Menyambungkan akun…</div>
    </div>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="animate-pulse text-sm opacity-70">Membuka…</div></div>}>
      <Inner />
    </Suspense>
  );
}
