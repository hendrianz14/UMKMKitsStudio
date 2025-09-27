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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-sheen flex items-center gap-3 rounded-3xl px-5 py-3 shadow-soft"
    >
      <Sparkles className="h-5 w-5 text-accent" />
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-charcoal/70">{plan} plan</p>
        <p className="text-lg font-semibold text-charcoal">
          {credits.toLocaleString('id-ID')} credits
        </p>
      </div>
      <span
        className="ml-auto rounded-full px-3 py-1 text-xs font-medium uppercase"
        style={{
          background:
            status === 'full'
              ? 'linear-gradient(135deg,#FDE7C5,#D09B59)'
              : status === 'steady'
                ? 'linear-gradient(135deg,#FFEAD2,#D5BA96)'
                : 'linear-gradient(135deg,#FFDAD1,#E4765A)',
          color: status === 'low' ? '#3B1F14' : '#2F2A28'
        }}
      >
        {status === 'full' ? 'Ready to create' : status === 'steady' ? 'Keep exploring' : 'Top up soon'}
      </span>
    </motion.div>
  );
}
