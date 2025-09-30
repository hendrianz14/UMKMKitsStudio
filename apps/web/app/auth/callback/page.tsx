"use client";

import { Suspense, useEffect } from "react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { supaBrowser } from "@/lib/supabase-browser";
import type { SupabaseClient } from "@supabase/supabase-js";

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
        if (error) return router.replace("/login?error=oauth");
      }

      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session) return router.replace("/login");

      await fetch("/api/auth/oauth-bootstrap", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => {});

      const redirectParam = search.get("redirect");
      const target =
        redirectParam && redirectParam.startsWith("/")
          ? (redirectParam as Route)
          : ("/dashboard" as Route);

      router.replace(target);
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
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-sm opacity-70">Membuka…</div>
        </div>
      }
    >
      <Inner />
    </Suspense>
  );
}
