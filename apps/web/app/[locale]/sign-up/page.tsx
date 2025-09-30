"use client";

import Link from "next/link";
import type { Route } from "next";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import {
  EmailField,
  PasswordField,
  isPasswordValid,
} from "@/components/auth/AuthFormParts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardX, CardXFooter, CardXHeader } from "@/components/ui/cardx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supaBrowser } from "@/lib/supabase-browser";
import { isAllowedGmail, isValidEmailFormat, normalizeEmail } from "@/lib/email";


const GoogleIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.82-.07-1.64-.23-2.43H12v4.6h6.46a5.5 5.5 0 0 1-2.38 3.62v3h3.84c2.24-2.07 3.54-5.12 3.54-8.79z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.2 0 5.88-1.06 7.84-2.89l-3.84-3c-1.07.74-2.45 1.18-4 1.18-3.08 0-5.69-2.08-6.62-4.88H1.4v3.08A12 12 0 0 0 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.38 14.41a7.18 7.18 0 0 1 0-4.82V6.51H1.4a12 12 0 0 0 0 10.98l3.98-3.08z"
    />
    <path
      fill="#EA4335"
      d="M12 4.73c1.74 0 3.3.6 4.54 1.78l3.4-3.4C17.88 1.09 15.2 0 12 0 7.32 0 2.98 2.7 1.4 6.51l3.98 3.08C6.31 6.81 8.92 4.73 12 4.73z"
    />
  </svg>
);

export default function SignUpPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const t = useTranslations("auth");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    try {
      supaBrowser();
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("[sign-up] Supabase config error", err);
      }
      setConfigError(true);
    }
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const passwordValid = useMemo(() => isPasswordValid(password), [password]);
  const dashboardPath = useMemo(() => (locale ? `/${locale}/dashboard` : "/dashboard"), [locale]);

  const handleSendCode = useCallback(async () => {
    if (sendingCode || countdown > 0) return;
    setError(null);

    const trimmedName = name.trim();
    const normalizedEmail = normalizeEmail(email);

    if (!trimmedName) {
      setError("Nama wajib diisi.");
      return;
    }
    if (!isValidEmailFormat(normalizedEmail)) {
      setError("Format email tidak valid.");
      return;
    }
    if (!isAllowedGmail(normalizedEmail)) {
      setError("Gunakan email @gmail.com.");
      return;
    }
    if (!passwordValid) {
      setError("Password belum memenuhi semua syarat.");
      return;
    }

    setSendingCode(true);
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          typeof result?.error === "string"
            ? result.error
            : response.status === 429
            ? "Terlalu sering. Coba lagi 1 menit."
            : "Gagal mengirim kode.";
        setError(message);
        if (response.status === 429) {
          setCountdown(60);
        }
        return;
      }
      if (email !== normalizedEmail) {
        setEmail(normalizedEmail);
      }
      setOtpSent(true);
      setOtpCode("");
      setCountdown(60);
      setError(null);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("[sign-up] Request OTP error", err);
      }
      setError("Terjadi kesalahan. Coba lagi nanti.");
    } finally {
      setSendingCode(false);
    }
  }, [countdown, email, name, passwordValid, sendingCode]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      const trimmedName = name.trim();
      const normalizedEmail = normalizeEmail(email);
      const sanitizedOtp = otpCode.trim();

      if (!trimmedName) {
        setError("Nama wajib diisi.");
        return;
      }
      if (!isValidEmailFormat(normalizedEmail)) {
        setError("Format email tidak valid.");
        return;
      }
      if (!isAllowedGmail(normalizedEmail)) {
        setError("Gunakan email @gmail.com.");
        return;
      }
      if (!passwordValid) {
        setError("Password belum memenuhi semua syarat.");
        return;
      }
      if (!otpSent) {
        setError("Kirim kode verifikasi terlebih dahulu.");
        return;
      }
      if (sanitizedOtp.length !== 6) {
        setError("Kode OTP harus 6 digit.");
        return;
      }

      setLoading(true);
      try {
        if (configError) {
          setError("Konfigurasi Supabase belum lengkap.");
          return;
        }

        const verifyResponse = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, code: sanitizedOtp }),
        });
        const verifyResult = await verifyResponse.json().catch(() => ({}));
        if (!verifyResponse.ok) {
          const message =
            typeof verifyResult?.error === "string"
              ? verifyResult.error
              : "Kode salah / kadaluarsa.";
          setError(message);
          if (verifyResponse.status === 429) {
            setCountdown(60);
          }
          return;
        }

        const completeResponse = await fetch("/api/auth/complete-signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            full_name: trimmedName,
            email: normalizedEmail,
            password,
          }),
        });
        const completeResult = await completeResponse.json().catch(() => ({}));
        if (!completeResponse.ok || completeResult?.ok !== true) {
          const message =
            typeof completeResult?.error === "string"
              ? completeResult.error
              : "Gagal mendaftar. Silakan coba lagi.";
          setError(message);
          return;
        }

        const supabase = supaBrowser();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (signInError) {
          setError(signInError.message || "Gagal masuk setelah pendaftaran.");
          return;
        }

        router.replace(dashboardPath as Route);
      } catch (err) {
        if (typeof window !== "undefined") {
          console.error("[sign-up] Register error", err);
        }
        if (err instanceof Error && err.message.includes("[supabase-browser]")) {
          setConfigError(true);
          setError("Konfigurasi Supabase belum lengkap.");
        } else {
          setError("Gagal mendaftar. Silakan coba lagi.");
        }
      } finally {
        setLoading(false);
      }
    },
    [configError, dashboardPath, email, name, otpCode, otpSent, password, passwordValid, router]
  );

  const handleGoogleSignIn = useCallback(async () => {
    setError(null);
    if (googleLoading) return;

    setGoogleLoading(true);
    try {
      if (configError) {
        setError("Konfigurasi Supabase belum lengkap.");
        setGoogleLoading(false);
        return;
      }

      const { error: oauthError } = await supaBrowser().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) {
        setError(oauthError.message || "Gagal masuk dengan Google.");
        setGoogleLoading(false);
      }
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("[sign-up] Google login error", err);
      }
      if (err instanceof Error && err.message.includes("[supabase-browser]")) {
        setConfigError(true);
        setError("Konfigurasi Supabase belum lengkap.");
      } else {
        setError("Gagal masuk dengan Google. Coba lagi nanti.");
      }
      setGoogleLoading(false);
    }
  }, [configError, googleLoading]);

  if (configError) {
    return (
      <div className="container mx-auto max-w-lg py-16">
        <CardX tone="surface" padding="lg">
          <CardXHeader
            title="Konfigurasi Supabase belum lengkap"
            subtitle="Lengkapi environment variable Supabase lalu jalankan ulang aplikasi."
          />
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                NEXT_PUBLIC_SUPABASE_URL
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </span>
            </li>
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
          title={t("signUp")}
          subtitle="Dapatkan 50 kredit gratis setelah mendaftar."
        />
        <div className="grid gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full justify-center gap-3 border border-border bg-background/60 text-foreground hover:bg-background"
            disabled={googleLoading || loading || sendingCode}
            onClick={() => void handleGoogleSignIn()}
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <GoogleIcon />
            )}
            <span className="ml-2 text-sm font-semibold">Masuk dengan Google</span>
          </Button>
        </div>
        <div className="relative flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex-1 border-t border-border/70" />
          <span>atau daftar dengan email</span>
          <span className="flex-1 border-t border-border/70" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Nama lengkap
            </label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama Anda"
              required
              className="text-white placeholder:text-muted-foreground"
            />
          </div>
          <EmailField
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="nama@brand.id"
            inputClassName="text-white placeholder:text-muted-foreground"
          />
          <PasswordField
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="••••••••"
            autoComplete="new-password"
            showStrength
            inputClassName="text-white placeholder:text-muted-foreground"
          />
          {otpSent ? (
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium text-foreground">
                Kode verifikasi
              </label>
              <Input
                id="otp"
                value={otpCode}
                onChange={(event) =>
                  setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                inputMode="numeric"
                pattern="\d*"
                maxLength={6}
                className="text-white placeholder:text-muted-foreground"
                required
              />
            </div>
          ) : null}
          {error ? (
            <Alert variant="destructive" className="w-full">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <div>
                <AlertTitle>Gagal mendaftar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          ) : null}
          <Button
            type="button"
            className="w-full btn-primary text-white"
            disabled={sendingCode || countdown > 0 || loading}
            onClick={() => void handleSendCode()}
          >
            {sendingCode ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Mengirim kode...
              </span>
            ) : countdown > 0 ? (
              `Kirim ulang (${countdown})`
            ) : (
              "Kirim Kode"
            )}
          </Button>
          <Button
            type="submit"
            className="w-full btn-primary text-white"
            disabled={loading || !otpSent || otpCode.trim().length !== 6}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Memproses...
              </span>
            ) : (
              t("signUp")
            )}
          </Button>
        </form>
        <CardXFooter>
          <p className="text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link href={`/${locale}/sign-in`} className="font-medium text-primary hover:text-primary/90">
              {t("signIn")}
            </Link>
          </p>
        </CardXFooter>
      </CardX>
    </div>
  );
}
