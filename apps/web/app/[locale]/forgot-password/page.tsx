"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { EmailField } from "@/components/auth/AuthFormParts";
import { Button } from "@/components/ui/button";
import { CardX, CardXFooter, CardXHeader } from "@/components/ui/cardx";
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
  const [success, setSuccess] = useState(false);
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);
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
      const { sendPasswordResetEmail } = await import("firebase/auth");
      await sendPasswordResetEmail(currentAuth, email);
      setSuccess(true);
    } catch (err) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code === "auth/user-not-found") {
        setError("Email belum terdaftar.");
      } else if (firebaseError.code === "auth/invalid-email") {
        setError("Email tidak valid.");
      } else {
        setError("Gagal mengirim tautan reset password. Coba lagi nanti.");
      }
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
        <CardXHeader
          title="Lupa password"
          subtitle="Masukkan email akun Anda dan kami akan mengirim tautan untuk reset password."
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <EmailField
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="nama@brand.id"
          />
          {success ? (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-400">
              <CheckCircle2 className="mt-0.5 h-4 w-4" aria-hidden="true" />
              <span>Kami mengirim tautan reset. Periksa email Anda.</span>
            </div>
          ) : null}
          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden="true" />
              <span>{error}</span>
            </div>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Mengirim...
              </span>
            ) : (
              "Kirim tautan reset"
            )}
          </Button>
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
