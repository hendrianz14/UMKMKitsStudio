import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import {
  BeforeAfterNoSSR,
  FeatureGridNoSSR,
  HeroInteractiveImageNoSSR,
  PricingSectionNoSSR
} from '@/components/no-ssr';
import { SectionHeading } from '@/components/SectionHeading';
import { Button } from '@/components/ui/button';

export default async function LocaleLanding({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  return (
    <div className="space-y-28">
      <section
        id="home"
        className="scroll-mt-[calc(var(--nav-h)+12px)] pt-6 md:pt-10 lg:pt-12"
      >
        <div className="container mx-auto">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-8">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                {locale === 'id' ? 'Studio AI untuk UMKM' : 'AI Studio for F&B brands'}
              </span>
              <h1 className="font-display text-4xl leading-tight text-white md:text-6xl">{t('heroTitle')}</h1>
              <p className="max-w-xl text-lg text-[var(--text-muted)]">{t('heroSubtitle')}</p>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="lg" asChild>
                  <Link href={`/${locale}/sign-up`}>{t('cta')}</Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link href={`/${locale}/editor`}>
                    {locale === 'id' ? 'Buka Editor' : 'Open Editor'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-sm text-[var(--text-muted)]">
                  {locale === 'id' ? 'Tanpa kartu kredit • Demo gratis 3 menit' : 'No credit card • Try the 3-minute demo'}
                </p>
              </div>
            </div>
            <HeroInteractiveImageNoSSR
              src="https://images.unsplash.com/photo-1521986329282-0436c1b74404?auto=format&fit=crop&w=1600&q=80"
              className="ml-auto w-full max-w-[720px]"
            />
          </div>
        </div>
      </section>

      <section
        id="features"
        className="space-y-12 scroll-mt-[calc(var(--nav-h)+12px)]"
      >
        <SectionHeading
          eyebrow={locale === 'id' ? 'Fitur Premium' : 'Premium Toolkit'}
          title={locale === 'id' ? 'Workflow lengkap untuk tim konten modern' : 'An end-to-end workflow for modern content teams'}
          description={
            locale === 'id'
              ? 'Template adaptif, akselerasi AI, dan distribusi omnichannel dalam satu studio.'
              : 'Adaptive templates, AI acceleration, and omnichannel distribution from one studio.'
          }
          align="left"
        />
        <FeatureGridNoSSR />
      </section>

      <section
        id="gallery"
        className="space-y-12 scroll-mt-[calc(var(--nav-h)+12px)]"
      >
        <SectionHeading
          eyebrow="Before / After"
          title={locale === 'id' ? 'Transformasi visual detik-detik' : 'Visual transformations in seconds'}
          description={
            locale === 'id'
              ? 'Lihat bagaimana Enhance AI mengubah foto mentah jadi materi kampanye siap pakai.'
              : 'See how Enhance AI turns raw photos into campaign-ready visuals.'
          }
          align="left"
        />
        <BeforeAfterNoSSR />
      </section>

      <section
        id="pricing"
        className="space-y-12 scroll-mt-[calc(var(--nav-h)+12px)]"
      >
        <SectionHeading
          eyebrow={locale === 'id' ? 'Harga Transparan' : 'Transparent Pricing'}
          title={locale === 'id' ? 'Paket fleksibel sesuai pertumbuhan' : 'Flexible tiers for every growth stage'}
          description={
            locale === 'id'
              ? 'Mulai gratis, upgrade saat tim dan kebutuhan produksi bertambah.'
              : 'Start free and upgrade as your team and production scale.'
          }
          align="left"
        />
        <PricingSectionNoSSR locale={locale} />
      </section>
    </div>
  );
}
