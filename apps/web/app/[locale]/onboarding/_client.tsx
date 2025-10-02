'use client';

export const dynamic = 'force-dynamic';

import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardX } from '@/components/ui/cardx';
import { Input } from '@/components/ui/input';
import { CreditBadge } from '@/components/credit-badge';
import { path } from '@/lib/locale-nav';
import { defaultLocale, isValidLocale, type Locale } from '@/lib/i18n';

export default function OnboardingPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale?: string }>();
  const t = useTranslations('auth');
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  const [business, setBusiness] = useState('');
  const [saving, setSaving] = useState(false);
  const resolvedLocale = useMemo<Locale>(() => {
    if (locale && isValidLocale(locale)) {
      return locale as Locale;
    }
    return defaultLocale;
  }, [locale]);
  const dashboardPath = useMemo(() => path('/[locale]/dashboard', resolvedLocale), [resolvedLocale]);

  const handleComplete = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const response = await fetch('/api/profile/onboarding-complete', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }
      router.replace(dashboardPath);
    } catch (error) {
      console.error('[onboarding] Failed to complete onboarding', error);
      setSaving(false);
    }
  }, [dashboardPath, router, saving]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <CardX tone="surface" padding="lg" className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">{t('onboarding')}</h1>
          <p className="text-sm text-muted-foreground">
          Pilih preferensi bahasa dan isi nama usaha Anda untuk menyesuaikan konten template.
        </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-foreground">Bahasa antarmuka</p>
            <div className="mt-3 flex gap-3">
              <Button
                type="button"
                variant={language === 'id' ? 'default' : 'secondary'}
                onClick={() => setLanguage('id')}
              >
                Bahasa Indonesia
              </Button>
              <Button
                type="button"
                variant={language === 'en' ? 'default' : 'secondary'}
                onClick={() => setLanguage('en')}
              >
                English
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground" htmlFor="business-name">
              Nama usaha
            </label>
            <Input
              id="business-name"
              className="mt-3"
              value={business}
              onChange={(event) => setBusiness(event.target.value)}
              placeholder="Contoh: Kopi Purnama"
            />
          </div>
        </div>
        <Button className="mt-2" size="lg" onClick={() => void handleComplete()}>
          Simpan preferensi
        </Button>
      </CardX>
      <CreditBadge credits={50} plan="free" />
    </div>
  );
}
