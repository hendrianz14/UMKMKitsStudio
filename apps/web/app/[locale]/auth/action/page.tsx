"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import {
  PasswordField,
  isPasswordValid,
} from "@/components/auth/AuthFormParts";
import { Button } from "@/components/ui/button";
import { CardX, CardXFooter, CardXHeader } from "@/components/ui/cardx";
import { getFirebaseAuth } from "@/lib/firebase-client";
import {
  collectMissingFirebaseEnvKeys,
  fetchMissingFirebaseEnvKeys,
  type FirebaseEnvKey,
} from "@/lib/firebase-env-check";

interface ResetState {
  email: string | null;
  status: "idle" | "checking" | "invalid" | "valid" | "completed" | "error";
  errorMessage?: string;
}

export default function AuthActionPage() {
  const searchParams = useSearchParams();
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");
  const continueUrl = searchParams.get("continueUrl") ?? process.env.APP_URL ?? undefined;

  const auth = getFirebaseAuth();
  const [missing, setMissing] = useState<FirebaseEnvKey[]>(collectMissingFirebaseEnvKeys());
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [reset, setReset] = useState<ResetState>({ email: null, status: "idle" });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!auth) {
      fetchMissingFirebaseEnvKeys().then((serverMissing) => {
        if (!serverMissing.length) return;
        setMissing((prev) => Array.from(new Set([...prev, ...serverMissing])));
      });
    }
  }, [auth]);

  useEffect(() => {
    if (!auth || !mode || !oobCode) return;

    if (mode === "verifyEmail") {
      setVerifyStatus("processing");
      void (async () => {
        try {
          const { applyActionCode } = await import("firebase/auth");
          await applyActionCode(auth, oobCode);
          setVerifyStatus("success");
          setVerifyError(null);
        } catch (error) {
          const firebaseError = error as { code?: string };
          setVerifyStatus("error");
          if (firebaseError.code === "auth/invalid-action-code") {
            setVerifyError("Kode verifikasi tidak valid atau sudah digunakan.");
          } else {
            setVerifyError("Gagal memverifikasi email. Coba lagi nanti.");
          }
        }
      })();
    }

    if (mode === "resetPassword") {
      setReset({ email: null, status: "checking" });
      void (async () => {
        try {
          const { verifyPasswordResetCode } = await import("firebase/auth");
          const emailFromCode = await verifyPasswordResetCode(auth, oobCode);
          setReset({ email: emailFromCode, status: "valid" });
        } catch (error) {
          const firebaseError = error as { code?: string };
          if (firebaseError.code === "auth/expired-action-code") {
            setReset({ email: null, status: "invalid", errorMessage: "Kode reset telah kedaluwarsa." });
          } else {
            setReset({ email: null, status: "invalid", errorMessage: "Kode reset tidak valid." });
          }
        }
      })();
    }
  }, [auth, mode, oobCode]);

  const passwordValid = useMemo(() => isPasswordValid(password), [password]);
  const passwordsMatch = password === confirmPassword;

  const handleResetSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth || !oobCode || reset.status !== "valid" || !passwordValid || !passwordsMatch) {
      return;
    }
    setSubmitting(true);
    try {
      const { confirmPasswordReset } = await import("firebase/auth");
      await confirmPasswordReset(auth, oobCode, password);
      setReset((prev) => ({ ...prev, status: "completed" }));
      setVerifyError(null);
    } catch (error) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === "auth/weak-password") {
        setVerifyError("Password terlalu lemah.");
      } else {
        setVerifyError("Gagal menyimpan password baru. Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!auth) {
    return (
      <div className="container mx-auto max-w-xl py-16">
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

  if (!mode || !oobCode) {
    return (
      <div className="container mx-auto max-w-xl py-16">
        <CardX tone="surface" padding="lg" className="space-y-4">
          <CardXHeader title="Tautan tidak valid" subtitle="Parameter yang dibutuhkan tidak ditemukan." />
          <CardXFooter>
            <Link href={`/${locale}/sign-in`} className="text-sm font-medium text-primary hover:text-primary/90">
              Kembali ke halaman masuk
            </Link>
          </CardXFooter>
        </CardX>
      </div>
    );
  }

  if (mode === "verifyEmail") {
    return (
      <div className="container mx-auto max-w-xl py-16">
        <CardX tone="surface" padding="lg" className="space-y-6 text-center">
          <CardXHeader title="Verifikasi Email" />
          {verifyStatus === "processing" ? (
            <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
              <p>Memverifikasi email Anda...</p>
            </div>
          ) : null}
          {verifyStatus === "success" ? (
            <div className="flex flex-col items-center gap-3 text-sm text-emerald-400">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              <p>Email Anda sudah terverifikasi. Terima kasih!</p>
            </div>
          ) : null}
          {verifyStatus === "error" && verifyError ? (
            <div className="flex items-start justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden="true" />
              <span>{verifyError}</span>
            </div>
          ) : null}
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={() => {
                if (continueUrl) {
                  window.location.href = continueUrl;
                  return;
                }
                if (locale) {
                  router.replace(`/${locale}/dashboard`);
                }
              }}
            >
              Ke Dashboard
            </Button>
          </div>
        </CardX>
      </div>
    );
  }

  if (mode === "resetPassword") {
    return (
      <div className="container mx-auto max-w-xl py-16">
        <CardX tone="surface" padding="lg" className="space-y-6">
          <CardXHeader
            title="Reset Password"
            subtitle={reset.email ? `Untuk akun ${reset.email}` : "Masukkan password baru untuk akun Anda."}
          />
          {reset.status === "checking" ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Memeriksa tautan reset...</span>
            </div>
          ) : null}
          {reset.status === "invalid" ? (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden="true" />
              <span>{reset.errorMessage ?? "Tautan reset tidak valid."}</span>
            </div>
          ) : null}
          {reset.status === "valid" ? (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <PasswordField
                label="Password baru"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                showStrength
              />
              <PasswordField
                label="Konfirmasi password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                showStrength={false}
              />
              {!passwordsMatch ? (
                <p className="text-sm text-destructive">Password tidak sama.</p>
              ) : null}
              {verifyError ? (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden="true" />
                  <span>{verifyError}</span>
                </div>
              ) : null}
              <Button type="submit" className="w-full" disabled={!passwordValid || !passwordsMatch || submitting}>
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Menyimpan...
                  </span>
                ) : (
                  "Simpan password"
                )}
              </Button>
            </form>
          ) : null}
          {reset.status === "completed" ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                <CheckCircle2 className="mt-0.5 h-4 w-4" aria-hidden="true" />
                <span>Password berhasil diperbarui. Silakan masuk dengan password baru Anda.</span>
              </div>
              <Button asChild className="w-full">
                <Link href={`/${locale}/sign-in`}>Masuk</Link>
              </Button>
            </div>
          ) : null}
        </CardX>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-xl py-16">
      <CardX tone="surface" padding="lg" className="space-y-4">
        <CardXHeader title="Tindakan tidak dikenal" subtitle="Mode tindakan tidak dikenali." />
        <CardXFooter>
          <Link href={`/${locale}/sign-in`} className="text-sm font-medium text-primary hover:text-primary/90">
            Kembali ke halaman masuk
          </Link>
        </CardXFooter>
      </CardX>
    </div>
  );
}
