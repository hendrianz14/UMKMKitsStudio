"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole } from "lucide-react";

import {
  PasswordField,
  isPasswordValid,
} from "@/components/auth/AuthFormParts";
import { Button } from "@/components/ui/button";
import { CardX, CardXFooter, CardXHeader } from "@/components/ui/cardx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getFirebaseAuth, getFirebaseFirestore } from "@/lib/firebase-client";
import { cn } from "@/lib/utils";
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
  const [actionError, setActionError] = useState<string | null>(null);
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
          try {
            await auth.currentUser?.reload();
          } catch (reloadError) {
            if (process.env.NODE_ENV !== "production") {
              console.warn("[auth-action] Failed to reload user after verification", reloadError);
            }
          }
          const firestore = getFirebaseFirestore();
          const currentUser = auth.currentUser;
          if (firestore && currentUser) {
            try {
              const { doc, getDoc, serverTimestamp, setDoc } = await import("firebase/firestore");
              const ref = doc(firestore, "users", currentUser.uid);
              const snapshot = await getDoc(ref);
              const data = snapshot.exists() ? (snapshot.data() as { credits?: number; verifiedAt?: unknown }) : null;
              const existingCredits = typeof data?.credits === "number" ? data.credits : null;
              const hasVerifiedAt = data?.verifiedAt != null;
              const updates: Record<string, unknown> = { verificationPending: false };
              if (!snapshot.exists() || existingCredits === null || existingCredits === 0 || !hasVerifiedAt) {
                updates.credits = 50;
                updates.verifiedAt = serverTimestamp();
              }
              await setDoc(ref, updates, { merge: true });
            } catch (firestoreError) {
              if (process.env.NODE_ENV !== "production") {
                console.error("[auth-action] Failed to update user verification state", firestoreError);
              }
            }
          }
          setVerifyStatus("success");
          setActionError(null);
        } catch (error) {
          const firebaseError = error as { code?: string };
          setVerifyStatus("error");
          if (firebaseError.code === "auth/invalid-action-code") {
            setActionError("Kode verifikasi tidak valid atau sudah digunakan.");
          } else {
            setActionError("Gagal memverifikasi email. Coba lagi nanti.");
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
      setActionError(null);
    } catch (error) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === "auth/weak-password") {
        setActionError("Password terlalu lemah.");
      } else {
        setActionError("Gagal menyimpan password baru. Coba lagi.");
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
    const verifying = verifyStatus === "processing";
    const verifySucceeded = verifyStatus === "success";
    const title = verifying
      ? "Memverifikasi email..."
      : verifySucceeded
        ? "Email terverifikasi!"
        : "Verifikasi tidak berhasil";
    const subtitle = verifying
      ? "Kami sedang memproses tautan verifikasi Anda."
      : verifySucceeded
        ? "Akun Anda siap digunakan. Kredit gratis Anda sudah aktif."
        : "Tautan verifikasi ini tidak lagi berlaku.";

    return (
      <div className="container mx-auto max-w-xl py-16">
        <CardX tone="surface" padding="lg" className="space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              className={cn(
                "rounded-full p-3",
                verifying
                  ? "bg-primary/15 text-primary"
                  : verifySucceeded
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-destructive/15 text-destructive"
              )}
            >
              {verifying ? (
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
              ) : verifySucceeded ? (
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-6 w-6" aria-hidden="true" />
              )}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-white">{title}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          {actionError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <div>
                <AlertTitle>Perlu tindakan</AlertTitle>
                <AlertDescription>{actionError}</AlertDescription>
              </div>
            </Alert>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              className="btn-primary text-white"
              disabled={!verifySucceeded}
              onClick={() => {
                if (!verifySucceeded) return;
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
            <Button type="button" variant="outline" className="text-white" asChild>
              <Link href={`/${locale}/sign-in`}>Masuk</Link>
            </Button>
          </div>
        </CardX>
      </div>
    );
  }

  if (mode === "resetPassword") {
    const checking = reset.status === "checking";
    const invalid = reset.status === "invalid";
    const valid = reset.status === "valid";
    const completed = reset.status === "completed";

    return (
      <div className="container mx-auto max-w-xl py-16">
        <CardX tone="surface" padding="lg" className="space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-primary/15 p-3 text-primary">
              <LockKeyhole className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-white">Setel password baru</h1>
              <p className="text-sm text-muted-foreground">
                {reset.email
                  ? `Tautan ini untuk akun ${reset.email}.`
                  : "Masukkan password baru untuk akun UMKM Kits Anda."}
              </p>
            </div>
          </div>
          {checking ? (
            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Memeriksa tautan reset...</span>
            </div>
          ) : null}
          {invalid ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <div>
                <AlertTitle>Tautan tidak valid</AlertTitle>
                <AlertDescription>
                  {reset.errorMessage ?? "Kode reset sudah kedaluwarsa atau pernah digunakan."}
                </AlertDescription>
              </div>
            </Alert>
          ) : null}
          {valid ? (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <PasswordField
                label="Password baru"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                showStrength
                inputClassName="text-white placeholder:text-muted-foreground"
              />
              <PasswordField
                label="Konfirmasi password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                showStrength={false}
                inputClassName="text-white placeholder:text-muted-foreground"
              />
              {!passwordsMatch ? (
                <p className="text-sm text-destructive">Password tidak sama.</p>
              ) : null}
              {actionError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  <div>
                    <AlertTitle>Gagal menyimpan</AlertTitle>
                    <AlertDescription>{actionError}</AlertDescription>
                  </div>
                </Alert>
              ) : null}
              <Button
                type="submit"
                className="btn-primary text-white w-full"
                disabled={!passwordValid || !passwordsMatch || submitting}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Menyimpan...
                  </span>
                ) : (
                  "Setel Password"
                )}
              </Button>
            </form>
          ) : null}
          {completed ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Password berhasil diperbarui.</span>
              </div>
              <Button asChild className="btn-primary text-white w-full">
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
