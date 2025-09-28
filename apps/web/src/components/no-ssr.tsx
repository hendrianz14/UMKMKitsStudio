"use client";

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

type NavbarComponent = typeof import('./Navbar')['Navbar'];
type FooterComponent = typeof import('./Footer')['Footer'];
type FeatureGridComponent = typeof import('./FeatureGrid')['FeatureGrid'];
type BeforeAfterComponent = typeof import('./BeforeAfter')['BeforeAfter'];
type PricingSectionComponent = typeof import('./PricingSection')['PricingSection'];
type HeroInteractiveImageComponent = typeof import('./HeroInteractiveImage')['default'];

export const NavbarNoSSR = dynamic<ComponentProps<NavbarComponent>>(
  () => import('./Navbar').then((mod) => mod.Navbar),
  { ssr: false }
);

export const FooterNoSSR = dynamic<ComponentProps<FooterComponent>>(
  () => import('./Footer').then((mod) => mod.Footer),
  { ssr: false }
);

export const FeatureGridNoSSR = dynamic<ComponentProps<FeatureGridComponent>>(
  () => import('./FeatureGrid').then((mod) => mod.FeatureGrid),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[5/3] rounded-2xl bg-secondary/30 animate-pulse" />
    ),
  }
);

export const BeforeAfterNoSSR = dynamic<ComponentProps<BeforeAfterComponent>>(
  () => import('./BeforeAfter').then((mod) => mod.BeforeAfter),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[5/3] rounded-2xl bg-secondary/30 animate-pulse" />
    ),
  }
);

export const PricingSectionNoSSR = dynamic<ComponentProps<PricingSectionComponent>>(
  () => import('./PricingSection').then((mod) => mod.PricingSection),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[5/3] rounded-2xl bg-secondary/30 animate-pulse" />
    ),
  }
);

export const HeroInteractiveImageNoSSR = dynamic<ComponentProps<HeroInteractiveImageComponent>>(
  () => import('./HeroInteractiveImage'),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[5/3] rounded-2xl bg-secondary/30 animate-pulse" />
    ),
  }
);
