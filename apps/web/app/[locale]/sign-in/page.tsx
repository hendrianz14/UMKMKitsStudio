"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { AuthProviderButtons } from "@/components/auth/AuthProviderButtons";
import { EmailField, PasswordField } from "@/components/auth/AuthFormParts";
import { Button } from "@/components/ui/button";
import { CardX, CardXFooter, CardXHeader } from "@/components/ui/cardx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { clientEnvFlags } from "@/lib/env-flags-client";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { ensureUserDoc } from "@/lib/user-profile";
import {
  collectMissingFirebaseEnvKeys,
  fetchMissingFirebaseEnvKeys,
  type FirebaseEnvKey,
} from "@/lib/firebase-env-check";

export default function SignInPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const t = useTranslations("auth");
  const auth = getFirebaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<FirebaseEnvKey[]>(collectMissingFirebaseEnvKeys());

  useEffect(() => {
    if (!auth) {
      fetchMissingFirebaseEnvKeys().then((serverMissing) => {
        if (!serverMissing.length) return;
        setMissing((prev) => {
          const merged = new Set([...prev, ...serverMissing]);
          return Array.from(merged);
        });
      });
    }
  }, [auth]);

  const errorMessages: Record<string, string> = useMemo(
    () => ({
      "auth/user-not-found": "Email belum terdaftar.",
      "auth/wrong-password": "Password salah.",
      "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi nanti.",
      "auth/invalid-credential": "Kredensial tidak valid.",
    }),
    []
  );

  const mapError = useCallback(
    (code: string | undefined) => {
      if (!code) return "Gagal masuk. Silakan coba lagi.";
      return errorMessages[code] ?? "Gagal masuk. Silakan coba lagi.";
    },
    [errorMessages]
  );

  const handleEnsureUser = useCallback(async () => {
    const currentUser = getFirebaseAuth()?.currentUser;
    if (currentUser) {
      await ensureUserDoc(currentUser);
      if (locale) {
        router.replace(`/${locale}/dashboard`);
      }
    }
  }, [locale, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const currentAuth = getFirebaseAuth();
    if (!currentAuth) {
      const missingKeys = collectMissingFirebaseEnvKeys(clientEnvFlags());
      setMissing((prev) => {
        const merged = new Set([...prev, ...missingKeys]);
        return Array.from(merged);
      });
      setError(
        missingKeys.length
          ? `Konfigurasi Firebase belum lengkap di client: ${missingKeys.join(", ")}`
          : "Konfigurasi Firebase belum lengkap."
      );
      return;
    }
    setLoading(true);
    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const credential = await signInWithEmailAndPassword(currentAuth, email, password);
      await ensureUserDoc(credential.user);
      if (locale) {
        router.replace(`/${locale}/dashboard`);
      }
    } catch (err: unknown) {
      if (typeof window !== "undefined") {
        console.error("[sign-in] Login error", err);
      }
      const firebaseError = err as { code?: string; message?: string };
      setError(mapError(firebaseError.code));
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
            subtitle="Lengkapi environment variable Firebase di Vercel atau .env.local, kemudian jalankan ulang aplikasi."
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
          title={t("signIn")}
          subtitle="Masuk untuk mengakses dashboard dan galeri aset Anda."
        />
        <AuthProviderButtons
          onSuccess={handleEnsureUser}
          onError={(err) => {
            setError(err.message || mapError((err as { code?: string }).code));
          }}
        />
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
          />
          <PasswordField
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="••••••••"
            autoComplete="current-password"
            showStrength={false}
          />
          <div className="flex items-center justify-between text-sm">
            <Link
              href={`/${locale}/forgot-password`}
              className="font-medium text-primary hover:text-primary/90"
            >
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
          <Button type="submit" className="w-full" disabled={loading}>
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
            <Link href={`/${locale}/sign-up`} className="font-medium text-primary hover:text-primary/90">
              {t("signUp")}
            </Link>
          </p>
        </CardXFooter>
      </CardX>
    </div>
  );
}
