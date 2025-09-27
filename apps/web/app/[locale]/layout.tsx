import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { unstable_setRequestLocale } from 'next-intl/server';
import { isValidLocale, locales } from '../../lib/i18n';
import { LangToggle } from '../../components/lang-toggle';

export const metadata: Metadata = {
  title: 'UMKM Kits Studio',
  description: 'Platform kreatif modern untuk UMKM kuliner dengan AI caption dan editor desain.'
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  unstable_setRequestLocale(locale);

  const messages = await import(`../../messages/${locale}.json`).then((mod) => mod.default);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="flex min-h-screen flex-col bg-sand text-charcoal" data-locale={locale}>
        <header className="sticky top-0 z-50 border-b border-cacao/10 bg-sand/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <span className="rounded-full bg-cacao px-3 py-1 text-sm text-sand">UMKM</span>
              Kits Studio
            </div>
            <LangToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
        <footer className="border-t border-cacao/10 bg-sand/80">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-charcoal/70 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} UMKM Kits Studio. All rights reserved.</p>
            <p className="text-xs uppercase tracking-[0.3em]">Made with warm aesthetics.</p>
          </div>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
