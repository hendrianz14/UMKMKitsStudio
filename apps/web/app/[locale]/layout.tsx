import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { unstable_setRequestLocale } from 'next-intl/server';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ToasterClient } from '@/components/ToasterClient';
import { isValidLocale, locales } from '@/lib/i18n';
import { FooterNoSSR, NavbarNoSSR } from '@/components/no-ssr';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const dynamic = 'force-dynamic';

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

  const messages = await import(`@/messages/${locale}.json`).then((mod) => mod.default);

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-dvh bg-background text-foreground font-sans antialiased',
          jakarta.variable
        )}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="flex min-h-dvh flex-col" data-locale={locale}>
            <NavbarNoSSR locale={locale} />
            <main className="container flex-1 pb-24 pt-12 lg:pt-16">{children}</main>
            <FooterNoSSR />
          </div>
          <ToasterClient />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
