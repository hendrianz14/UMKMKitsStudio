'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { getFirebaseAuth } from '../../../lib/firebase-client';

export default function SignInPage(props: any) {
  const params = props.params as { locale: string };
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const auth = getFirebaseAuth();
    if (!auth) {
      setError('Konfigurasi Firebase belum lengkap.');
      return;
    }
    setLoading(true);
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal masuk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-cacao/10 bg-white/80 p-8 shadow-soft">
      <h1 className="text-2xl font-semibold text-charcoal">{t('signIn')}</h1>
      <p className="mt-2 text-sm text-charcoal/70">
        Masuk untuk mengakses dashboard dan galeri aset Anda.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-charcoal">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-cacao/20 bg-white px-4 py-3 text-base text-charcoal shadow-sm focus:border-cacao focus:outline-none"
          />
        </label>
        <label className="block text-sm font-medium text-charcoal">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-cacao/20 bg-white px-4 py-3 text-base text-charcoal shadow-sm focus:border-cacao focus:outline-none"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Memproses...' : t('signIn')}
        </Button>
      </form>
      <div className="mt-6 text-center text-sm text-charcoal/70">
        Belum punya akun?{' '}
        <Link href={`/${params.locale}/sign-up`} className="font-semibold text-cacao">
          {t('signUp')}
        </Link>
      </div>
    </div>
  );
}
