'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';

import { href } from '@/lib/locale-nav';
import { Button } from '@/components/ui/button';
import { defaultLocale, isValidLocale, type Locale } from '@/lib/i18n';

const SUPPORTED_LOCALES = ['id', 'en'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isSupportedLocale(value: string | undefined): value is SupportedLocale {
  return value !== undefined && SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

function buildTargetHref(pathname: string | null | undefined, locale: Locale) {
  const path = pathname ?? '/';
  const segments = path.split('/').filter(Boolean);
  const hasLocale = segments.length > 0 && isSupportedLocale(segments[0]);
  const rest = hasLocale ? segments.slice(1) : segments;

  if (rest.length === 0) {
    return href('/[locale]', locale);
  }

  if (rest.length === 1) {
    switch (rest[0]) {
      case 'dashboard':
        return href('/[locale]/dashboard', locale);
      case 'editor':
        return href('/[locale]/editor', locale);
      case 'onboarding':
        return href('/[locale]/dashboard', locale);
      case 'gallery':
        return href('/[locale]/gallery', locale);
      case 'caption-ai':
        return href('/[locale]/caption-ai', locale);
      case 'forgot-password':
        return href('/[locale]/forgot-password', locale);
      case 'sign-in':
        return href('/[locale]/sign-in', locale);
      case 'sign-up':
        return href('/[locale]/sign-up', locale);
      default:
        return href('/[locale]', locale);
    }
  }

  if (rest[0] === 'auth') {
    const segment = rest[1];
    switch (segment) {
      case 'callback':
        return href('/[locale]/auth/callback', locale);
      case 'action':
        return href('/[locale]/auth/action', locale);
      case 'update-password':
        return href('/[locale]/auth/update-password', locale);
      default:
        return href('/[locale]/auth/callback', locale);
    }
  }

  return href('/[locale]', locale);
}

export function LangToggle() {
  const pathname = usePathname();

  const { currentLocale, nextLocale, targetHref } = useMemo(() => {
    const path = pathname ?? '/';
    const segments = path.split('/').filter(Boolean);
    const detected = segments.find((segment) => isSupportedLocale(segment));
    const locale: Locale = detected && isValidLocale(detected) ? (detected as Locale) : defaultLocale;
    const next: Locale = locale === 'id' ? 'en' : 'id';
    return {
      currentLocale: locale,
      nextLocale: next,
      targetHref: buildTargetHref(pathname, next)
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
