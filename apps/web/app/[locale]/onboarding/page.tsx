'use client';

export const dynamic = 'force-dynamic';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { CardX } from '../../../components/ui/cardx';
import { Input } from '../../../components/ui/input';
import { CreditBadge } from '../../../components/credit-badge';

export default function OnboardingPage() {
  const t = useTranslations('auth');
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  const [business, setBusiness] = useState('');

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
        <Button className="mt-2" size="lg">
          Simpan preferensi
        </Button>
      </CardX>
      <CreditBadge credits={50} plan="free" />
    </div>
  );
}
