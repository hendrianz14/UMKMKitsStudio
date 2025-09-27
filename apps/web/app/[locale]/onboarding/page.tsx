'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { CreditBadge } from '../../../components/credit-badge';

export default function OnboardingPage() {
  const t = useTranslations('auth');
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  const [business, setBusiness] = useState('');

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="rounded-3xl border border-cacao/10 bg-white/80 p-8 shadow-soft">
        <h1 className="text-3xl font-semibold text-charcoal">{t('onboarding')}</h1>
        <p className="mt-2 text-sm text-charcoal/70">
          Pilih preferensi bahasa dan isi nama usaha Anda untuk menyesuaikan konten template.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-charcoal">Bahasa antarmuka</label>
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
            <label className="text-sm font-semibold text-charcoal">Nama usaha</label>
            <input
              className="mt-3 w-full rounded-2xl border border-cacao/20 bg-white px-4 py-3 text-base text-charcoal focus:border-cacao focus:outline-none"
              value={business}
              onChange={(event) => setBusiness(event.target.value)}
              placeholder="Contoh: Kopi Purnama"
            />
          </div>
        </div>
        <Button className="mt-8" size="lg">
          Simpan preferensi
        </Button>
      </div>
      <CreditBadge credits={50} plan="free" />
    </div>
  );
}
