// apps/web/app/auth/callback/page.tsx
"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supaBrowser } from "@/lib/supabase-browser";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic"; // jangan diprerender

function CallbackInner() {
  const router = useRouter();
  const search = useSearchParams();
  const once = useRef(false);

  useEffect(() => {
    if (once.current) return;
    once.current = true;

    const run = async () => {
      const sb: SupabaseClient = supaBrowser();

      // PKCE (?code=...)
      const code = search.get("code");
      if (code) {
        const { error } = await sb.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          console.error("exchangeCodeForSession error:", error);
          router.replace("/login?error=oauth");
          return;
        }
      }

      // Dapatkan session; bootstrap user baru; redirect
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      await fetch("/api/auth/oauth-bootstrap", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => {});

      router.replace("/dashboard");
    };

    run();
  }, [router, search]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse text-sm opacity-70">Menyambungkan akun…</div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse text-sm opacity-70">Membuka…</div>
          </div>
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
