import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { use } from 'react';
import '../styles/globals.css';
import 'sonner/dist/styles.css';
import { cn } from '../lib/utils';
import { ToasterClient } from '../components/ToasterClient';

export const dynamic = 'force-dynamic';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'UMKM Kits Studio',
  description: 'Studio kreatif modern untuk UMKM kuliner dengan dukungan AI.'
};

export default function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale ?? 'id';

  return (
    <html lang={locale} className={cn('dark', jakarta.variable)} suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground font-sans antialiased">
        {children}
        <ToasterClient />
      </body>
    </html>
  );
}
