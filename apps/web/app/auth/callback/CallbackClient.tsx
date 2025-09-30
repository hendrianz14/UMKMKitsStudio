"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supaBrowser } from "@/lib/supabase-browser";
import type { SupabaseClient } from "@supabase/supabase-js";

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
        try {
          const { error } = await sb.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
          router.replace("/dashboard");
          return;
        } catch (e) {
          console.error("exchangeCodeForSession error:", e);
          router.replace("/login?error=oauth");
          return;
        }
      }

      // Implicit (#access_token=...) → supabase-js auto-parse hash
      const { data: sub } = sb.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN") {
          sub.subscription.unsubscribe();
          router.replace("/dashboard");
        } else if (event === "SIGNED_OUT") {
          sub.subscription.unsubscribe();
          router.replace("/login");
        }
      });

      // Fallback jika event tak muncul
      setTimeout(async () => {
        const {
          data: { user },
        } = await sb.auth.getUser();
        sub.subscription.unsubscribe();
        router.replace(user ? "/dashboard" : "/login");
      }, 800);
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

export default function CallbackClientPage() {
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
