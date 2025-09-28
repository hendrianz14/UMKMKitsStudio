'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { CardX, CardXFooter, CardXHeader } from '../../../components/ui/cardx';
import { getFirebaseAuth } from '../../../lib/firebase-client';

export default function SignUpPage() {
  const { locale } = useParams<{ locale: string }>();
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
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mendaftar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-lg py-16">
      <CardX tone="surface" padding="lg">
        <CardXHeader
          title={t('signUp')}
          subtitle="Dapatkan 50 kredit gratis setelah mendaftar."
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Memproses...' : t('signUp')}
          </Button>
        </form>
        <CardXFooter>
          <p className="text-sm text-muted-foreground">
            Sudah punya akun?{' '}
            <Link href={`/${locale}/sign-in`} className="font-medium text-primary hover:text-primary/90">
              {t('signIn')}
            </Link>
          </p>
        </CardXFooter>
      </CardX>
    </div>
  );
}
