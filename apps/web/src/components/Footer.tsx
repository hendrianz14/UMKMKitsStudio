'use client';

import Link from 'next/link';
import { FormEvent } from 'react';
import { Mail, Send, Twitter, Youtube } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from './ui/toast';

const columns = [
  {
    title: 'Produk',
    links: [
      { label: 'Fitur Editor', href: '#features' },
      { label: 'Galeri', href: '#gallery' },
      { label: 'Harga', href: '#pricing' }
    ]
  },
  {
    title: 'Perusahaan',
    links: [
      { label: 'Tentang Kami', href: '/about' },
      { label: 'Karier', href: '/careers' },
      { label: 'Blog', href: '/blog' }
    ]
  },
  {
    title: 'Bantuan',
    links: [
      { label: 'Pusat Bantuan', href: '/support' },
      { label: 'Status Sistem', href: '/status' },
      { label: 'Hubungi', href: '/contact' }
    ]
  }
];

export function Footer() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = data.get('newsletter') as string;
    toast.success('Terima kasih! Kami akan mengirim insight terbaru.', {
      description: email
    });
    form.reset();
  };

  return (
    <footer className="border-t border-white/10 bg-surface/60 backdrop-blur">
      <div className="container py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-white">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-accent text-white shadow-lg">
                <Send className="h-4 w-4" />
              </span>
              UMKM Kits Studio
            </div>
            <p className="max-w-sm text-sm text-[var(--text-muted)]">
              Studio kreatif dengan AI untuk UMKM: susun materi promosi, optimalkan foto produk, hingga rilis kampanye hanya dalam menit.
            </p>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link aria-label="Twitter" href="https://x.com/umkmkits">
                  <Twitter className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link aria-label="YouTube" href="https://youtube.com">
                  <Youtube className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link aria-label="Newsletter" href="mailto:hello@umkmkits.id">
                  <Mail className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
          {columns.map((column) => (
            <div key={column.title} className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-widest text-white/80">{column.title}</h4>
              <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link className="transition hover:text-white" href={link.href as never}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 grid gap-6 border-t border-white/10 pt-8 md:grid-cols-[minmax(0,1fr)_360px]">
          <p className="text-sm text-[var(--text-muted)]">
            © {new Date().getFullYear()} UMKM Kits Studio. Seluruh hak cipta dilindungi.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm text-[var(--text-muted)] md:flex-row md:items-center">
            <label htmlFor="newsletter" className="md:w-40">
              Dapatkan tips konten
            </label>
            <div className="flex w-full gap-2">
              <Input id="newsletter" name="newsletter" type="email" placeholder="suremail@brand.id" required className="flex-1" />
              <Button type="submit">Langganan</Button>
            </div>
          </form>
        </div>
      </div>
    </footer>
  );
}
