'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { CardX, CardXFooter, CardXHeader } from '../../../components/ui/cardx';
import { clientEnvFlags } from '@/lib/env-flags-client';
import { getFirebaseAuth } from '@/lib/firebase-client';

const CLIENT_FLAG_TO_ENV_KEY: Record<keyof ReturnType<typeof clientEnvFlags>, string> = {
  API_KEY: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  AUTH_DOMAIN: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  PROJECT_ID: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  STORAGE_BUCKET: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  APP_ID: 'NEXT_PUBLIC_FIREBASE_APP_ID'
};

async function readEnvFlags(): Promise<string[]> {
  try {
    const res = await fetch('/api/env-check', { cache: 'no-store' });
    const json = await res.json();
    const missing: string[] = [];
    if (!json?.flags?.API_KEY) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
    if (!json?.flags?.AUTH_DOMAIN) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
    if (!json?.flags?.PROJECT_ID) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    if (!json?.flags?.STORAGE_BUCKET) missing.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
    if (!json?.flags?.APP_ID) missing.push('NEXT_PUBLIC_FIREBASE_APP_ID');
    return missing;
  } catch {
    return [];
  }
}

export default function SignInPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations('auth');
  const flags = clientEnvFlags();
  const missingClientKeys = Object.entries(flags)
    .filter(([, value]) => !value)
    .map(([key]) => CLIENT_FLAG_TO_ENV_KEY[key as keyof typeof CLIENT_FLAG_TO_ENV_KEY]);
  const auth = getFirebaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>(missingClientKeys);

  useEffect(() => {
    if (!auth) {
      readEnvFlags().then((serverMissing) => {
        if (!serverMissing.length) return;
        setMissing((prev) => {
          const merged = new Set([...prev, ...serverMissing]);
          return Array.from(merged);
        });
      });
    }
  }, [auth]);

  if (!auth) {
    return (
      <div className="container max-w-lg mx-auto py-16">
        <h1 className="text-xl font-semibold mb-2">Konfigurasi Firebase belum lengkap</h1>
        <p className="text-sm text-muted-foreground">
          Pastikan variable berikut diisi di Vercel (Production/Preview) atau <code>.env.local</code> pada <code>apps/web/</code>,{' '}
          lalu redeploy/jalankan ulang:
        </p>
        <ul className="mt-3 list-disc list-inside text-sm">
          {missing.map((key) => (
            <li key={key}>
              <code>{key}</code>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Cek cepat: <a className="underline" href="/api/env-check" target="_blank" rel="noreferrer">/api/env-check</a>
        </p>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const flags = clientEnvFlags();
    const currentAuth = getFirebaseAuth();
    if (!currentAuth) {
      const missingKeys = Object.entries(flags)
        .filter(([, value]) => !value)
        .map(([key]) => CLIENT_FLAG_TO_ENV_KEY[key as keyof typeof CLIENT_FLAG_TO_ENV_KEY]);
      setMissing((prev) => {
        const merged = new Set([...prev, ...missingKeys]);
        return Array.from(merged);
      });
      setError(
        missingKeys.length
          ? `Konfigurasi Firebase belum lengkap di client: ${missingKeys.join(', ')}`
          : 'Konfigurasi Firebase belum lengkap.'
      );
      return;
    }
    setLoading(true);
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(currentAuth, email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal masuk.');
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !auth;

  return (
    <div className="container mx-auto max-w-lg py-16">
      <CardX tone="surface" padding="lg">
        <CardXHeader
          title={t('signIn')}
          subtitle="Masuk untuk mengakses dashboard dan galeri aset Anda."
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              placeholder="nama@brand.id"
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              placeholder="••••••••"
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={disabled}>
            {loading ? 'Memproses...' : t('signIn')}
          </Button>
        </form>
        <CardXFooter>
          <p className="text-sm text-muted-foreground">
            Belum punya akun?{' '}
            <Link href={`/${locale}/sign-up`} className="font-medium text-primary hover:text-primary/90">
              {t('signUp')}
            </Link>
          </p>
        </CardXFooter>
      </CardX>
    </div>
  );
}
