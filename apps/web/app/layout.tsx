import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'UMKM Kits Studio',
  description: 'Studio kreatif modern untuk UMKM kuliner dengan dukungan AI.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-sand text-charcoal antialiased">
        {children}
      </body>
    </html>
  );
}
