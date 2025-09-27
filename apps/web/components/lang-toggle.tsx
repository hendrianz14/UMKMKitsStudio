'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button } from './ui/button';

export function LangToggle() {
  const pathname = usePathname();
  const locale = useLocale();
  const nextLocale = locale === 'id' ? 'en' : 'id';
  const href = (pathname ?? '/') as Route;

  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href={href} locale={nextLocale} prefetch>
        {nextLocale.toUpperCase()}
      </Link>
    </Button>
  );
}
