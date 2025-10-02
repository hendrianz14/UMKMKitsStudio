"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole } from "lucide-react";

import {
  PasswordField,
  isPasswordValid,
} from "@/components/auth/AuthFormParts";
import { Button } from "@/components/ui/button";
import { CardX, CardXFooter, CardXHeader } from "@/components/ui/cardx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { SupabaseBrowserClient } from "@/lib/supabase-browser";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";
import {
  collectMissingSupabaseEnvKeys,
  fetchMissingSupabaseEnvKeys,
  type SupabaseEnvKey,
} from "@/lib/supabase-env-check";
import { defaultLocale, isValidLocale, type Locale } from "@/lib/i18n";

interface ResetState {
  email: string | null;
  status: "idle" | "checking" | "invalid" | "valid" | "completed" | "error";
  errorMessage?: string;
}

export default function AuthActionPage() {
  const searchParams = useSearchParams();
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const supabase = useMemo<SupabaseBrowserClient | null>(() => {
    try {
      return getSupabaseBrowserClient();
    } catch (error) {
      if (typeof window !== "undefined") {
        console.error("[auth-action] Supabase config error", error);
      }
      return null;
    }
  }, []);
  const [hashParams, setHashParams] = useState<URLSearchParams | null>(null);
  const [missing, setMissing] = useState<SupabaseEnvKey[]>(collectMissingSupabaseEnvKeys());
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [actionError, setActionError] = useState<string | null>(null);
  const [reset, setReset] = useState<ResetState>({ email: null, status: "idle" });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const envReady = missing.length === 0;
  const resolvedLocale = useMemo<Locale>(() => {
    if (locale && isValidLocale(locale)) {
      return locale as Locale;
    }
    return defaultLocale;
  }, [locale]);
  const loginHref = useMemo(
    () => ({ pathname: "/[locale]/sign-in", params: { locale: resolvedLocale } }) as const,
    [resolvedLocale]
  );
  const dashboardHref = useMemo(
    () => ({ pathname: "/[locale]/dashboard", params: { locale: resolvedLocale } }) as const,
    [resolvedLocale]
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    setHashParams(new URLSearchParams(window.location.hash.replace(/^#/, "")));
  }, [searchParams]);

  const getParam = useCallback(
    (key: string) => {
      const fromSearch = searchParams.get(key);
      if (fromSearch !== null) {
        return fromSearch;
      }
      return hashParams?.get(key) ?? undefined;
    },
    [hashParams, searchParams]
  );

  const rawMode = searchParams.get("mode");
  const supabaseType = getParam("type");
  const continueUrl = getParam("continueUrl");
  const mode = rawMode
    ? rawMode
    : supabaseType === "recovery"
      ? "resetPassword"
      : supabaseType === "signup"
        ? "verifyEmail"
        : null;

  useEffect(() => {
    if (envReady) return;
    fetchMissingSupabaseEnvKeys().then((serverMissing) => {
      if (!serverMissing.length) return;
      setMissing((prev) => Array.from(new Set([...prev, ...serverMissing])));
    });
  }, [envReady]);

  const applySessionFromUrl = useCallback(async () => {
    if (!supabase) {
      throw new Error("Supabase belum siap");
    }
    const accessToken = getParam("access_token");
    const refreshToken = getParam("refresh_token");
    const code = getParam("code");
    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
      return data.session ?? null;
    }
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      return data.session ?? null;
    }
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session ?? null;
  }, [getParam, supabase]);

  useEffect(() => {
    if (!supabase || !mode) return;

    if (mode === "verifyEmail") {
      setVerifyStatus("processing");
      setActionError(null);
      void (async () => {
        try {
          await applySessionFromUrl();
          const { data, error } = await supabase.auth.getUser();
          if (error) throw error;
          if (data.user?.email_confirmed_at) {
            setVerifyStatus("success");
          } else {
            setVerifyStatus("error");
            setActionError("Email belum terverifikasi. Coba masuk ulang dan cek tautan terbaru.");
          }
        } catch (error) {
          console.error("[auth-action] Failed to verify email", error);
          setVerifyStatus("error");
          setActionError("Gagal memverifikasi email. Coba lagi nanti.");
        }
      })();
    }

    if (mode === "resetPassword") {
      setReset({ email: null, status: "checking" });
      void (async () => {
        try {
          const session = await applySessionFromUrl();
          const emailFromSession = session?.user?.email;
          if (emailFromSession) {
            setReset({ email: emailFromSession, status: "valid" });
            return;
          }
          const { data, error } = await supabase.auth.getUser();
          if (error) throw error;
          if (data.user?.email) {
            setReset({ email: data.user.email, status: "valid" });
            return;
          }
          throw new Error("Email tidak ditemukan");
        } catch (error) {
          console.error("[auth-action] Invalid recovery link", error);
          setReset({
            email: null,
            status: "invalid",
            errorMessage: "Tautan reset tidak valid atau sudah kedaluwarsa.",
          });
        }
      })();
    }
  }, [applySessionFromUrl, mode, supabase]);

  const passwordValid = useMemo(() => isPasswordValid(password), [password]);
  const passwordsMatch = password === confirmPassword;

  const handleResetSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || reset.status !== "valid" || !passwordValid || !passwordsMatch) {
      return;
    }
    setSubmitting(true);
    try {
      await applySessionFromUrl();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        if (error.message && /weak|short/i.test(error.message)) {
          setActionError("Password terlalu lemah.");
        } else {
          throw error;
        }
        return;
      }
      setReset((prev) => ({ ...prev, status: "completed" }));
      setActionError(null);
    } catch (error) {
      console.error("[auth-action] Failed to update password", error);
      setActionError("Gagal menyimpan password baru. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!envReady || !supabase) {
    return (
      <div className="container mx-auto max-w-xl py-16">
        <CardX tone="surface" padding="lg">
          <CardXHeader
            title="Konfigurasi Supabase belum lengkap"
            subtitle="Lengkapi environment variable Supabase lalu jalankan ulang aplikasi."
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

  if (!mode) {
    return (
      <div className="container mx-auto max-w-xl py-16">
        <CardX tone="surface" padding="lg" className="space-y-4">
          <CardXHeader title="Tautan tidak valid" subtitle="Parameter yang dibutuhkan tidak ditemukan." />
          <CardXFooter>
            <Link href={loginHref} className="text-sm font-medium text-primary hover:text-primary/90">
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
                router.replace(dashboardHref as unknown as Parameters<typeof router.replace>[0]);
              }}
            >
              Ke Dashboard
            </Button>
            <Button type="button" variant="outline" className="text-white" asChild>
              <Link href={loginHref}>Masuk</Link>
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
                <Link href={loginHref}>Masuk</Link>
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
          <Link href={loginHref} className="text-sm font-medium text-primary hover:text-primary/90">
            Kembali ke halaman masuk
          </Link>
        </CardXFooter>
      </CardX>
    </div>
  );
}
