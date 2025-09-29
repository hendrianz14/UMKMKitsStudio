"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { MailCheck, RefreshCw, Send, ShieldCheck } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardX, CardXHeader } from "@/components/ui/cardx";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import { normalizeEmail } from "@/lib/email";

const RESEND_WINDOW_MS = 10 * 60 * 1000;

function formatCooldown(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes} menit${seconds ? ` ${seconds} detik` : ""}`;
  }
  return `${seconds} detik`;
}

function Spinner() {
  return <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />;
}

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    if (!supabase) return;
    let unsubscribed = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!unsubscribed) {
          setUser(data.session?.user ?? null);
        }
      })
      .catch((error) => {
        console.warn("[verify-email] Failed to get session", error);
        if (!unsubscribed) setUser(null);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      unsubscribed = true;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!cooldownEndsAt) return;
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownEndsAt]);

  useEffect(() => {
    if (cooldownEndsAt && cooldownEndsAt <= Date.now()) {
      setCooldownEndsAt(null);
    }
  }, [cooldownEndsAt, now]);

  const emailFromParams = searchParams?.get("email") ?? "";
  const displayEmail = useMemo(() => {
    const fromUser = user?.email ? normalizeEmail(user.email) : "";
    const fromParams = emailFromParams ? normalizeEmail(emailFromParams) : "";
    return fromUser || fromParams;
  }, [emailFromParams, user?.email]);

  const remainingMs = cooldownEndsAt ? Math.max(0, cooldownEndsAt - now) : 0;
  const hasCooldown = remainingMs > 0;

  const actionUrlBase = useMemo(() => {
    const base =
      process.env.APP_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      (typeof window !== "undefined" ? window.location.origin : undefined);
    return base ? base.replace(/\/$/, "") : undefined;
  }, []);

  const handleResend = async () => {
    setResending(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const normalizedEmail = displayEmail ? normalizeEmail(displayEmail) : "";

    try {
      if (normalizedEmail) {
        const response = await fetch("/api/auth/resend-verification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: normalizedEmail }),
        });

        if (response.status === 429) {
          const payload = (await response.json().catch(() => null)) as
            | { retryAfterMinutes?: number }
            | null;
          const retryMinutes = payload?.retryAfterMinutes ?? 10;
          setCooldownEndsAt(Date.now() + retryMinutes * 60 * 1000);
          setErrorMessage(`Tunggu ${retryMinutes} menit sebelum mengirim ulang.`);
        } else if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(payload?.message ?? "Gagal mengirim ulang verifikasi.");
        } else {
          setInfoMessage("Email verifikasi telah dikirim ulang.");
          setCooldownEndsAt(Date.now() + RESEND_WINDOW_MS);
        }
      } else {
        setErrorMessage("Masukkan email yang valid untuk mengirim ulang tautan verifikasi.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengirim ulang verifikasi.";
      setErrorMessage(message);
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!supabase) {
      setErrorMessage("Supabase belum siap. Coba lagi beberapa saat.");
      return;
    }

    setChecking(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      const currentUser = data.user;
      if (!currentUser) {
        if (locale) {
          router.replace(`/${locale}/sign-in`);
        }
        return;
      }

      if (currentUser.email_confirmed_at) {
        if (locale) {
          router.replace(`/${locale}/dashboard`);
        }
        return;
      }
      setErrorMessage("Email belum terverifikasi. Coba cek kembali tautan di inbox Anda.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memeriksa status verifikasi.";
      setErrorMessage(message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="container mx-auto max-w-lg py-16">
      <CardX tone="surface" padding="lg" className="space-y-6">
        <CardXHeader
          title="Verifikasi email Anda"
          subtitle="Kami telah mengirim tautan verifikasi ke alamat email berikut."
        />
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          <div className="flex items-center gap-3">
            <MailCheck className="h-5 w-5" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-medium text-white">{displayEmail || "Email belum tersedia"}</p>
              <p className="text-xs text-primary/80">
                Buka email tersebut dan klik tombol verifikasi untuk mengaktifkan akun Anda.
              </p>
            </div>
          </div>
        </div>
        {infoMessage ? (
          <Alert className="border-emerald-500/40 bg-emerald-500/10">
            <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            <div>
              <AlertTitle className="text-emerald-400">Berhasil</AlertTitle>
              <AlertDescription className="text-emerald-300">{infoMessage}</AlertDescription>
            </div>
          </Alert>
        ) : null}
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Perlu tindakan</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}
        {hasCooldown ? (
          <p className="text-xs text-muted-foreground">
            Anda dapat mengirim ulang dalam {formatCooldown(remainingMs)}.
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            className="btn-primary text-white"
            onClick={handleResend}
            disabled={resending || hasCooldown}
          >
            {resending ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                Mengirim...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Send className="h-4 w-4" aria-hidden="true" />
                Kirim ulang verifikasi
              </span>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCheckVerification}
            disabled={checking}
            className="text-white"
          >
            {checking ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                Memeriksa...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Saya sudah verifikasi
              </span>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Tidak menemukan emailnya? Cek folder spam/promosi atau tambahkan no-reply@supabase.com ke daftar kontak.
        </p>
      </CardX>
    </div>
  );
}
