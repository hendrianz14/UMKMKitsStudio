'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

const SUPPORTED_LOCALES = ['id', 'en'] as const;

function buildTargetPath(pathname: string | null | undefined, locale: string) {
  const path = pathname ?? '/';
  const segments = path.split('/').filter(Boolean);
  const hasLocale = segments.length > 0 && SUPPORTED_LOCALES.includes(segments[0] as (typeof SUPPORTED_LOCALES)[number]);
  if (hasLocale) {
    const [, ...rest] = segments;
    const next = rest.length ? `/${rest.join('/')}` : '';
    return `/${locale}${next}` as Route;
  }
  return `/${locale}${path === '/' ? '' : path}` as Route;
}

export function LangToggle() {
  const pathname = usePathname();

  const { currentLocale, nextLocale, targetHref } = useMemo(() => {
    const path = pathname ?? '/';
    const segments = path.split('/').filter(Boolean);
    const detected = segments.find((segment) => SUPPORTED_LOCALES.includes(segment as (typeof SUPPORTED_LOCALES)[number]));
    const locale = (detected ?? 'id') as (typeof SUPPORTED_LOCALES)[number];
    const next = locale === 'id' ? 'en' : 'id';
    return {
      currentLocale: locale,
      nextLocale: next,
      targetHref: buildTargetPath(pathname, next)
    };
  }, [pathname]);

  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href={targetHref} prefetch>
        {nextLocale.toUpperCase()} · {currentLocale.toUpperCase()}
      </Link>
    </Button>
  );
}
