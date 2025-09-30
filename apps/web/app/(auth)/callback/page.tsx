"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supaBrowser } from "@/lib/supabase-browser";

export default function AuthCallback() {
  const router = useRouter();
  const search = useSearchParams();
  const once = useRef(false);

  useEffect(() => {
    if (once.current) return;
    once.current = true;

    const run = async () => {
      const sb = supaBrowser();

      // 1) Flow PKCE (query param ?code=...) -> tukar code jadi session
      const code = search.get("code");
      if (code) {
        try {
          // Supabase butuh full URL
          await sb.auth.exchangeCodeForSession(window.location.href);
          router.replace("/dashboard");
          return;
        } catch (e) {
          console.error("exchangeCodeForSession error:", e);
          router.replace("/login?error=oauth");
          return;
        }
      }

      // 2) Flow implicit (hash #access_token=...) -> Supabase otomatis deteksi
      // Saat halaman ini ter-load dan client dibuat, supabase-js akan membaca hash
      // dan menyimpan session. Kita tinggal tunggu event SIGNED_IN sebentar.
      const { data: listener } = sb.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN") {
          listener.subscription.unsubscribe();
          router.replace("/dashboard");
        } else if (event === "SIGNED_OUT") {
          listener.subscription.unsubscribe();
          router.replace("/login");
        }
      });

      // fallback, kalau event tidak datang (mis. hash sudah diproses),
      // cek user lalu redirect
      setTimeout(async () => {
        const { data: { user } } = await sb.auth.getUser();
        listener.subscription.unsubscribe();
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
