import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { unstable_setRequestLocale } from 'next-intl/server';
import { isValidLocale, locales } from '../../lib/i18n';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';

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
      <div className="flex min-h-screen flex-col bg-background text-[var(--text-primary)]" data-locale={locale}>
        <Navbar locale={locale} showSections={false} />
        <main className="container flex-1 pb-24 pt-28">{children}</main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}
