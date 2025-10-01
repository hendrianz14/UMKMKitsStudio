"use client";

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { CardX, CardXFooter, CardXHeader } from './ui/cardx';

const plans = [
  {
    name: 'Free',
    price: 'Rp0',
    billing: '/bulan',
    description: 'Eksperimen dengan 50 kredit gratis setiap bulan dan watermark minimal.',
    features: ['50 kredit/bulan', 'Export resolusi HD', 'Watermark mikro di sudut bawah'],
    cta: 'Mulai Gratis',
    href: '/auth/signup',
    highlight: false
  },
  {
    name: 'Pro',
    price: 'Rp249k',
    billing: '/bulan',
    description: 'Optimalkan konten rutin dengan 1000 kredit dan prioritas render.',
    features: [
      '1000 kredit/bulan',
      'Tanpa watermark',
      'Prioritas antrian AI',
      'Integrasi Instagram & TikTok Scheduler'
    ],
    cta: 'Upgrade ke Pro',
    href: '/topup',
    highlight: true
  },
  {
    name: 'Business',
    price: 'Hubungi Kami',
    billing: '',
    description: 'Custom seat, SLA khusus, dan workspace multi-cabang untuk brand skala nasional.',
    features: ['Kredit fleksibel', 'Workspace multi-seat', 'Integrasi API & Webhook', 'Dedicated success manager'],
    cta: 'Jadwalkan Demo',
    href: '/contact',
    highlight: false
  }
];

export function PricingSection({ locale = 'id' }: { locale?: string }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan, idx) => {
        const href = plan.href.startsWith('/') ? `/${locale}${plan.href}` : plan.href;
        return (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.22, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <CardX
              tone="surface"
              emphasis={plan.highlight ? 'featured' : 'default'}
              className={plan.highlight ? 'relative overflow-hidden' : undefined}
              padding="lg"
            >
              {plan.highlight ? (
                <span className="absolute -top-3 right-4 rounded-full bg-[linear-gradient(135deg,#3B82F6,#6366F1,#8B5CF6)] px-3 py-1 text-xs font-semibold text-white shadow-lg">
                  Best Value
                </span>
              ) : null}
              <CardXHeader title={plan.name} subtitle={plan.description} />
              <div className="space-y-6">
                <div className="text-4xl font-semibold text-foreground">
                  {plan.price}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">{plan.billing}</span>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <CardXFooter>
                <Button className="w-full" variant={plan.highlight ? 'default' : 'secondary'} asChild>
                  <a href={href}>{plan.cta}</a>
                </Button>
              </CardXFooter>
            </CardX>
          </motion.div>
        );
      })}
    </div>
  );
}
