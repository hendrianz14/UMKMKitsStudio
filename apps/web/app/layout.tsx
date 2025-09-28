import type { Metadata } from 'next';
import '../styles/globals.css';
import 'sonner/dist/styles.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'UMKM Kits Studio',
  description: 'Studio kreatif modern untuk UMKM kuliner dengan dukungan AI.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
