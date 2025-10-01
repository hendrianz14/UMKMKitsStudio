'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
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
    return { pathname: '/[locale]', params: { locale } } as const;
  }

  if (rest.length === 1) {
    switch (rest[0]) {
      case 'dashboard':
        return { pathname: '/[locale]/dashboard', params: { locale } } as const;
      case 'editor':
        return { pathname: '/[locale]/editor', params: { locale } } as const;
      case 'onboarding':
        return { pathname: '/[locale]/onboarding', params: { locale } } as const;
      case 'gallery':
        return { pathname: '/[locale]/gallery', params: { locale } } as const;
      case 'forgot-password':
        return { pathname: '/[locale]/forgot-password', params: { locale } } as const;
      default:
        return { pathname: '/[locale]', params: { locale } } as const;
    }
  }

  if (rest[0] === 'auth') {
    const segment = rest[1];
    switch (segment) {
      case 'login':
        return { pathname: '/[locale]/auth/login', params: { locale } } as const;
      case 'signup':
        return { pathname: '/[locale]/auth/signup', params: { locale } } as const;
      case 'callback':
        return { pathname: '/[locale]/auth/callback', params: { locale } } as const;
      case 'action':
        return { pathname: '/[locale]/auth/action', params: { locale } } as const;
      default:
        return { pathname: '/[locale]/auth/login', params: { locale } } as const;
    }
  }

  return { pathname: '/[locale]', params: { locale } } as const;
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
