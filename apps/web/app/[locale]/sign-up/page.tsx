"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { AuthProviderButtons } from "@/components/auth/AuthProviderButtons";
import {
  EmailField,
  PasswordField,
  isPasswordValid,
} from "@/components/auth/AuthFormParts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardX, CardXFooter, CardXHeader } from "@/components/ui/cardx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { ensureUserDoc } from "@/lib/user-profile";
import {
  collectMissingFirebaseEnvKeys,
  fetchMissingFirebaseEnvKeys,
  type FirebaseEnvKey,
} from "@/lib/firebase-env-check";
import {
  isAllowedDomain,
  isValidEmailFormat,
  normalizeEmail,
} from "@/lib/email";

export default function SignUpPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const t = useTranslations("auth");
  const auth = getFirebaseAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<FirebaseEnvKey[]>(collectMissingFirebaseEnvKeys());

  useEffect(() => {
    if (!auth) {
      fetchMissingFirebaseEnvKeys().then((serverMissing) => {
        if (!serverMissing.length) return;
        setMissing((prev) => Array.from(new Set([...prev, ...serverMissing])));
      });
    }
  }, [auth]);

  const passwordValid = useMemo(() => isPasswordValid(password), [password]);

  const mapError = useCallback((code?: string) => {
    switch (code) {
      case "auth/email-already-in-use":
        return "Email sudah terdaftar.";
      case "auth/invalid-email":
        return "Format email tidak valid.";
      case "auth/weak-password":
        return "Password terlalu lemah.";
      default:
        return "Gagal mendaftar. Silakan coba lagi.";
    }
  }, []);

  const handleProviderSuccess = useCallback(async () => {
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
    if (!isAllowedDomain(normalizedEmail, ["gmail.com"])) {
      setError("Gunakan email @gmail.com");
      return;
    }
    if (!passwordValid) {
      setError("Password belum memenuhi semua syarat.");
      return;
    }
    if (email !== normalizedEmail) {
      setEmail(normalizedEmail);
    }

    const currentAuth = getFirebaseAuth();
    if (!currentAuth) {
      const missingKeys = collectMissingFirebaseEnvKeys();
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
      const {
        createUserWithEmailAndPassword,
        sendEmailVerification,
        updateProfile,
      } = await import("firebase/auth");
      const credential = await createUserWithEmailAndPassword(currentAuth, normalizedEmail, password);
      await updateProfile(credential.user, { displayName: trimmedName });
      const baseUrl =
        process.env.APP_URL ??
        process.env.NEXT_PUBLIC_APP_URL ??
        (typeof window !== "undefined" ? window.location.origin : undefined);
      const actionUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/auth/action` : undefined;
      if (actionUrl) {
        await sendEmailVerification(credential.user, { url: actionUrl });
      } else {
        await sendEmailVerification(credential.user);
      }
      await ensureUserDoc(credential.user, { name: trimmedName });
      if (locale) {
        router.replace(`/${locale}/dashboard?verification=check-email`);
      }
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("[sign-up] Register error", err);
      }
      const firebaseError = err as { code?: string };
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
          title={t("signUp")}
          subtitle="Dapatkan 50 kredit gratis setelah mendaftar."
        />
        <AuthProviderButtons
          onSuccess={handleProviderSuccess}
          onError={(error) => {
            setError(error.message || mapError((error as { code?: string }).code));
          }}
        />
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
            />
          </div>
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
            autoComplete="new-password"
            showStrength
          />
          {error ? (
            <Alert variant="destructive" className="w-full">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <div>
                <AlertTitle>Gagal mendaftar</AlertTitle>
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
