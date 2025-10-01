"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supaBrowser } from "@/lib/supabase-browser";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Route } from "next";

export const dynamic = "force-dynamic";

async function waitForSession(sb: SupabaseClient, tries = 8, delay = 150) {
  for (let i = 0; i < tries; i++) {
    const { data: { session } } = await sb.auth.getSession();
    if (session) return session;
    await new Promise(r => setTimeout(r, delay));
  }
  return null;
}

function Inner() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    (async () => {
      const sb: SupabaseClient = supaBrowser();

      // Biarkan supabase-js memproses ?code=... otomatis (detectSessionInUrl: true)
      // Lalu tunggu session-nya siap
      let session = await waitForSession(sb);
      if (!session) {
        // Terakhir, coba manual exchange hanya jika benar2 ada ?code=
        const code = search.get("code");
        if (code) {
          try {
            const { error } = await sb.auth.exchangeCodeForSession(window.location.href);
            if (!error) session = (await sb.auth.getSession()).data.session ?? null;
          } catch { /* ignore */ }
        }
      }
      if (!session) {
        router.replace("/login" as Route);
        return;
      }

      // Sinkronkan cookie sesi ke server (agar SSR melihat user)
      try {
        await fetch("/api/auth/session-sync", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }),
        });
      } catch {}

      // Bootstrap user OAuth (profiles + free plan + credits trial) — idempotent
      try {
        await fetch("/api/auth/oauth-bootstrap", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } catch {}

      // Redirect aman ke target
      const raw = search.get("redirect");
      const to: Route = raw && raw.startsWith("/") ? (raw as Route) : ("/dashboard" as Route);
      router.replace(to);
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
