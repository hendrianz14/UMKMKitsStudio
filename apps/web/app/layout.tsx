import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '../styles/globals.css';
import 'sonner/dist/styles.css';
import { Toaster } from 'sonner';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'UMKM Kits Studio',
  description: 'Studio kreatif modern untuk UMKM kuliner dengan dukungan AI.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning className={jakarta.variable}>
      <body className="min-h-screen bg-background text-[var(--text-primary)] font-sans antialiased">
        {children}
        <Toaster richColors position="top-center" closeButton toastOptions={{ duration: 3500 }} />
      </body>
    </html>
  );
}
