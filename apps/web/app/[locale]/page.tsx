import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Hero3D } from '../../components/hero-3d';
import { Button } from '../../components/ui/button';
import { templates } from '../../data/templates';

export default async function LocaleLanding({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  return (
    <div className="space-y-20">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center rounded-full bg-cacao/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cacao">
            Warm modern aesthetics
          </span>
          <h1 className="font-display text-4xl leading-tight text-charcoal sm:text-5xl lg:text-6xl">
            {t('heroTitle')}
          </h1>
          <p className="text-lg text-charcoal/70 lg:text-xl">{t('heroSubtitle')}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={`/${locale}/sign-up`}>{t('cta')}</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href={`/${locale}/gallery`}>{t('gallery')}</Link>
            </Button>
          </div>
        </div>
        <div className="h-[420px] overflow-hidden rounded-3xl border border-cacao/10 bg-white/60 shadow-soft">
          <Hero3D />
        </div>
      </section>

      <section className="rounded-3xl border border-cacao/10 bg-white/70 p-10 shadow-soft">
        <h2 className="text-2xl font-semibold text-charcoal">Paket template tradisional modern</h2>
        <p className="mt-2 text-charcoal/70">
          Pilih dari koleksi desain yang menonjolkan identitas kuliner Nusantara dengan sentuhan premium.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div key={template.id} className="rounded-3xl border border-transparent bg-sand/60 p-5 transition hover:border-cacao/40">
              <h3 className="text-lg font-semibold text-charcoal">{template.name}</h3>
              <p className="mt-2 text-sm text-charcoal/70">{template.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-3">
        <div className="rounded-3xl border border-cacao/10 bg-white/80 p-6 shadow-soft">
          <h3 className="text-xl font-semibold text-charcoal">Caption AI realtime</h3>
          <p className="mt-2 text-sm text-charcoal/70">
            Integrasi dengan workflow n8n memastikan hasil caption cepat dan konsisten dengan tone brand Anda.
          </p>
        </div>
        <div className="rounded-3xl border border-cacao/10 bg-white/80 p-6 shadow-soft">
          <h3 className="text-xl font-semibold text-charcoal">Top up aman</h3>
          <p className="mt-2 text-sm text-charcoal/70">
            Pembayaran Midtrans Snap dengan verifikasi signature server-side dan riwayat transaksi transparan.
          </p>
        </div>
        <div className="rounded-3xl border border-cacao/10 bg-white/80 p-6 shadow-soft">
          <h3 className="text-xl font-semibold text-charcoal">Galeri terpadu</h3>
          <p className="mt-2 text-sm text-charcoal/70">
            Semua aset tersimpan di Firebase Storage dengan aturan keamanan ketat sesuai kepemilikan.
          </p>
        </div>
      </section>
    </div>
  );
}
