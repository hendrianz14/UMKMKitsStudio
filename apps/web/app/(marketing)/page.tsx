import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { Hero3D } from '../../src/components/Hero3D';
import { FeatureGrid } from '../../src/components/FeatureGrid';
import { BeforeAfter } from '../../src/components/BeforeAfter';
import { PricingSection } from '../../src/components/PricingSection';
import { SectionHeading } from '../../src/components/SectionHeading';
import { Button } from '../../src/components/ui/button';
import { defaultLocale } from '../../lib/i18n';


export const dynamic = 'force-dynamic';

export default function MarketingPage() {
  const locale = defaultLocale;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-white">
      <Navbar locale={locale} showSections />
      <main className="relative pt-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-radial-hero" aria-hidden />
        <section id="hero" className="container grid items-center gap-12 pb-28 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Studio AI untuk UMKM
            </span>
            <h1 className="max-w-xl font-display text-4xl leading-tight text-white md:text-6xl">
              Visual interaktif & caption AI untuk scale up brand kuliner Anda
            </h1>
            <p className="max-w-xl text-lg text-[var(--text-muted)]">
              Bangun storytelling makanan yang menggugah selera, tingkatkan engagement, dan kelola tim konten dari satu studio modern dengan aksen biru kosmik.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg" asChild>
                <Link href={`/${locale}/sign-up`}>Coba Gratis Sekarang</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>

                <a href="#editor-demo">
                  Lihat Editor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>

              </Button>
              <p className="text-sm text-[var(--text-muted)]">Tidak perlu kartu kredit • 3 menit onboarding</p>
            </div>
          </div>
          <Hero3D />
        </section>

        <section id="features" className="container space-y-12 pb-28">
          <SectionHeading
            eyebrow="Fitur Premium"
            title="Satu studio untuk ide, produksi, dan distribusi konten"
            description="Workflow modern yang memadukan AI, template adaptif, dan automasi publikasi."
          />
          <FeatureGrid />
        </section>

        <section id="gallery" className="container space-y-12 pb-28">
          <SectionHeading
            eyebrow="Before / After"
            title="Transformasi visual dalam hitungan detik"
            description="Bandingkan hasil Enhance AI kami dengan foto mentah pelanggan UMKM."
          />
          <BeforeAfter />
        </section>

        <section id="pricing" className="container space-y-12 pb-28">
          <SectionHeading
            eyebrow="Harga Transparan"
            title="Paket fleksibel untuk semua fase pertumbuhan"
            description="Skalakan dengan kredit AI, workspace kolaboratif, dan support prioritas."
          />
          <PricingSection locale={locale} />
        </section>

        <section id="editor-demo" className="container pb-32">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-surface/70 p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
              <div className="flex-1 space-y-4">
                <h3 className="text-2xl font-semibold text-white">Editor realtime yang siap produksi</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Coba demo editor langsung di browser Anda. Gunakan preset kanvas, filter, dan AI caption yang sama seperti versi produksi.
                </p>
                <Button asChild>
                  <Link href={`/${locale}/editor`}>Buka Editor</Link>
                </Button>
              </div>
              <div className="flex-1 rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-[var(--text-muted)]">
                <p className="font-semibold text-white">Highlight:</p>
                <ul className="mt-3 space-y-2">
                  <li>• Grid adaptif & snapping presisi 8px.</li>
                  <li>• Layer panel dengan visibilitas & drag reorder.</li>
                  <li>• Export langsung ke Firebase Storage & galeri tim.</li>
                  <li>• Aksi AI: Enhance, Image-to-Image, Caption generator.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
