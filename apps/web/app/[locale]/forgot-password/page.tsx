"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole } from "lucide-react";

import { EmailField } from "@/components/auth/AuthFormParts";
import { Button } from "@/components/ui/button";
import { CardX, CardXFooter, CardXHeader } from "@/components/ui/cardx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { clientEnvFlags } from "@/lib/env-flags-client";
import { getFirebaseAuth } from "@/lib/firebase-client";
import {
  collectMissingFirebaseEnvKeys,
  fetchMissingFirebaseEnvKeys,
  type FirebaseEnvKey,
} from "@/lib/firebase-env-check";

export default function ForgotPasswordPage() {
  const { locale } = useParams<{ locale: string }>();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [missing, setMissing] = useState<FirebaseEnvKey[]>(collectMissingFirebaseEnvKeys());
  const auth = getFirebaseAuth();

  useEffect(() => {
    if (!auth) {
      fetchMissingFirebaseEnvKeys().then((serverMissing) => {
        if (!serverMissing.length) return;
        setMissing((prev) => Array.from(new Set([...prev, ...serverMissing])));
      });
    }
  }, [auth]);

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

  const remainingMs = cooldownEndsAt ? Math.max(0, cooldownEndsAt - now) : 0;
  const cooldownActive = remainingMs > 0;
  const cooldownMinutes = Math.floor(remainingMs / (60 * 1000));
  const cooldownSeconds = Math.ceil((remainingMs % (60 * 1000)) / 1000);
  const cooldownLabel = cooldownActive
    ? [cooldownMinutes > 0 ? `${cooldownMinutes} menit` : null, cooldownSeconds ? `${cooldownSeconds} detik` : null]
        .filter(Boolean)
        .join(" ")
    : "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    const currentAuth = getFirebaseAuth();
    if (!currentAuth) {
      const missingKeys = collectMissingFirebaseEnvKeys(clientEnvFlags());
      setMissing((prev) => Array.from(new Set([...prev, ...missingKeys])));
      setError(
        missingKeys.length
          ? `Konfigurasi Firebase belum lengkap di client: ${missingKeys.join(", ")}`
          : "Konfigurasi Firebase belum lengkap."
      );
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.status === 429) {
        const payload = (await response.json().catch(() => ({}))) as {
          retryAfterMinutes?: number;
        };
        const minutes = Number(payload.retryAfterMinutes ?? 0);
        if (minutes > 0) {
          setCooldownEndsAt(Date.now() + minutes * 60 * 1000);
        }
        const retryText = minutes > 0 ? `sekitar ${minutes} menit` : "nanti";
        setError(`Sudah ada permintaan baru-baru ini. Coba lagi ${retryText}.`);
        return;
      }

      const payload = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setError("Gagal memproses permintaan. Coba lagi nanti.");
        return;
      }

      setSuccessMessage(payload?.message ?? "Jika email terdaftar, kami kirim tautan reset.");
      setCooldownEndsAt(null);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("[forgot-password] request error", err);
      }
      setError("Gagal memproses permintaan. Coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  if (!auth) {
    return (
      <div className="container mx-auto max-w-lg py-16">
        <CardX tone="surface" padding="lg">
          <CardXHeader
            title="Konfigurasi Firebase belum lengkap"
            subtitle="Lengkapi environment variable Firebase lalu jalankan ulang aplikasi."
          />
          <ul className="space-y-1 text-sm">
            {missing.map((key) => (
              <li key={key} className="flex items-center gap-2">
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{key}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Cek cepat: <a className="underline" href="/api/env-check" target="_blank" rel="noreferrer">/api/env-check</a>
          </p>
        </CardX>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg py-16">
      <CardX tone="surface" padding="lg" className="space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-primary/15 p-3 text-primary">
            <LockKeyhole className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-white">Butuh reset password?</h1>
            <p className="text-sm text-muted-foreground">
              Masukkan email Anda dan kami akan mengirim tautan untuk mengatur ulang password.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <EmailField
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="nama@brand.id"
            inputClassName="text-white placeholder:text-muted-foreground"
          />
          {successMessage ? (
            <Alert variant="success" className="w-full">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <div>
                <AlertTitle>Permintaan diterima</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </div>
            </Alert>
          ) : null}
          {error ? (
            <Alert variant="destructive" className="w-full">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <div>
                <AlertTitle>Gagal mengirim tautan</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          ) : null}
          <Button type="submit" className="w-full btn-primary text-white" disabled={loading || cooldownActive}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Mengirim...
              </span>
            ) : (
              "Kirim tautan reset"
            )}
          </Button>
          {cooldownActive ? (
            <p className="text-xs text-muted-foreground">
              Permintaan baru bisa dilakukan dalam {cooldownLabel}.
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Tautan reset berlaku sekitar 1 jam (aturan Firebase). Cek folder Spam/Promotions bila belum terlihat.
          </p>
        </form>
        <CardXFooter>
          <Link
            href={`/${locale}/sign-in`}
            className="text-sm font-medium text-primary hover:text-primary/90"
          >
            Kembali ke halaman masuk
          </Link>
        </CardXFooter>
      </CardX>
    </div>
  );
}
