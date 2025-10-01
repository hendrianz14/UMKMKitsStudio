"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { Route } from "next";
import { AlertCircle, Loader2 } from "lucide-react";

import { EmailField, PasswordField } from "@/components/auth/AuthFormParts";
import { Button } from "@/components/ui/button";
import { CardX, CardXFooter, CardXHeader } from "@/components/ui/cardx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supaBrowser } from "@/lib/supabase-browser";
import { defaultLocale, isValidLocale, type Locale } from "@/lib/i18n";

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

export default function SignInPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    try {
      supaBrowser();
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("[sign-in] Supabase config error", err);
      }
      setConfigError(true);
    }
  }, []);

  const resolvedLocale = useMemo<Locale>(() => {
    if (locale && isValidLocale(locale)) return locale as Locale;
    if (typeof window !== "undefined") {
      const segment = window.location.pathname.split("/").filter(Boolean)[0];
      if (segment && isValidLocale(segment)) {
        return segment as Locale;
      }
    }
    return defaultLocale;
  }, [locale]);
  const dashboardHref = useMemo<Route>(
    () => (`/${resolvedLocale}/dashboard`) as Route,
    [resolvedLocale]
  );
  const forgotPasswordHref = useMemo<Route>(
    () => (`/${resolvedLocale}/forgot-password`) as Route,
    [resolvedLocale]
  );
  const signUpHref = useMemo<Route>(
    () => (`/${resolvedLocale}/auth/signup`) as Route,
    [resolvedLocale]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const emailNormalized = email.trim().toLowerCase();
    if (!emailNormalized || !password) {
      setError("Kredensial tidak valid.");
      return;
    }

    setLoading(true);
    try {
      if (configError) {
        setError("Konfigurasi Supabase belum lengkap.");
        return;
      }

      const supabase = supaBrowser();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailNormalized,
        password,
      });
      if (signInError) {
        setError(signInError.message || "Kredensial tidak valid.");
        return;
      }
      router.replace(dashboardHref);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("[sign-in] Login error", err);
      }
      if (err instanceof Error && err.message.includes("[supabase-browser]")) {
        setConfigError(true);
        setError("Konfigurasi Supabase belum lengkap.");
      } else {
        setError("Kredensial tidak valid.");
      }
    } finally {
      setLoading(false);
    }
  };

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

      const nextPath = `/${resolvedLocale}/dashboard`;
      const { error: oauthError } = await supaBrowser().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/${resolvedLocale}/auth/callback?next=${encodeURIComponent(
            nextPath
          )}`,
        },
      });
      if (oauthError) {
        setError(oauthError.message || "Gagal masuk dengan Google.");
        setGoogleLoading(false);
      }
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("[sign-in] Google login error", err);
      }
      if (err instanceof Error && err.message.includes("[supabase-browser]")) {
        setConfigError(true);
        setError("Konfigurasi Supabase belum lengkap.");
      } else {
        setError("Gagal masuk dengan Google. Coba lagi nanti.");
      }
      setGoogleLoading(false);
    }
  }, [configError, googleLoading, resolvedLocale]);

  if (configError) {
    return (
      <div className="container mx-auto max-w-lg py-16">
        <CardX tone="surface" padding="lg">
          <CardXHeader
            title="Konfigurasi Supabase belum lengkap"
            subtitle="Lengkapi environment variable Supabase di Vercel atau .env.local, kemudian jalankan ulang aplikasi."
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
          title={t("signIn")}
          subtitle="Masuk untuk mengakses dashboard dan galeri aset Anda."
        />
        <div className="grid gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full justify-center gap-3 border border-border bg-background/60 text-foreground hover:bg-background"
            disabled={googleLoading || loading}
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
          <span>atau masuk dengan email</span>
          <span className="flex-1 border-t border-border/70" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            autoComplete="current-password"
            showStrength={false}
            inputClassName="text-white placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between text-sm">
            <Link href={forgotPasswordHref} className="font-medium text-primary hover:text-primary/90">
              Lupa password?
            </Link>
          </div>
          {error ? (
            <Alert variant="destructive" className="w-full">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <div>
                <AlertTitle>Gagal masuk</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          ) : null}
          <Button type="submit" className="w-full btn-primary text-white" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Memproses...
              </span>
            ) : (
              t("signIn")
            )}
          </Button>
        </form>
        <CardXFooter>
          <p className="text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link href={signUpHref} className="font-medium text-primary hover:text-primary/90">
              {t("signUp")}
            </Link>
          </p>
        </CardXFooter>
      </CardX>
    </div>
  );
}
