"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { path } from "@/lib/locale-nav";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Route } from "next";
import { defaultLocale, isValidLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic"; // client-only, no prerender

async function waitForSession(sb: SupabaseClient, tries = 10, delay = 150) {
  for (let i = 0; i < tries; i++) {
    const {
      data: { session },
    } = await sb.auth.getSession();
    if (session) return session;
    await new Promise((r) => setTimeout(r, delay));
  }
  return null;
}

function CallbackInner() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const search = useSearchParams();

  const paramsLocale = params?.locale;
  const locale: Locale = paramsLocale && isValidLocale(paramsLocale) ? paramsLocale : defaultLocale;

  useEffect(() => {
    (async () => {
      const sb: SupabaseClient = supabaseBrowser;

      // Biarkan supabase-js auto proses PKCE (?code=...) via detectSessionInUrl
      let session = await waitForSession(sb);
      if (!session) {
        const code = search.get("code");
        if (code) {
          try {
            const { error } = await sb.auth.exchangeCodeForSession(window.location.href);
            if (!error) {
              session = (await sb.auth.getSession()).data.session ?? null;
            }
          } catch {
            /* ignore */
          }
        }
      }

      if (!session) {
        router.replace(path("/[locale]/sign-in", locale));
        return;
      }

      // Sinkronkan cookie sesi untuk SSR
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

      // Bootstrap user OAuth (idempotent)
      try {
        await fetch("/api/auth/oauth-bootstrap", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } catch {}

      // Tentukan target redirect
      const nextRaw = search.get("next");
      if (nextRaw && nextRaw.startsWith("/")) {
        router.replace(nextRaw as Route);
        return;
      }

      router.replace(path("/[locale]/dashboard", locale));
    })();
  }, [router, search, params, locale]);

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
      <CallbackInner />
    </Suspense>
  );
}
