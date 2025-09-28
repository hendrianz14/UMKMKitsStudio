'use client';

import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface CreditBadgeProps {
  credits: number;
  plan: 'free' | 'pro';
}

export function CreditBadge({ credits, plan }: CreditBadgeProps) {
  const status = useMemo(() => {
    if (credits > 500) return 'full';
    if (credits > 100) return 'steady';
    return 'low';
  }, [credits]);

  const statusLabel =
    status === 'full' ? 'Ready to create' : status === 'steady' ? 'Keep exploring' : 'Top up soon';

  const statusClassName =
    status === 'full'
      ? 'bg-primary/20 text-primary'
      : status === 'steady'
        ? 'bg-muted/60 text-foreground'
        : 'bg-destructive/20 text-destructive';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-2xl border border-border bg-background/60 px-4 py-3"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="min-w-[140px]">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{plan} plan</p>
        <p className="text-lg font-semibold text-foreground">
          {credits.toLocaleString('id-ID')} credits
        </p>
      </div>
      <span className={`ml-auto inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusClassName}`}>
        {statusLabel}
      </span>
    </motion.div>
  );
}
