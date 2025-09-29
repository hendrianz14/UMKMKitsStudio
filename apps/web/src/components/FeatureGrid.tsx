"use client";

import { motion } from 'framer-motion';
import { Brain, Grid, Image, Layers, Sparkles, Wand2 } from 'lucide-react';
import { CardX } from './ui/cardx';

const features = [
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: 'Editor Template',
    description: 'Ratusan template siap pakai dengan grid pintar dan sistem warna brand-friendly.'
  },
  {
    icon: <Brain className="h-5 w-5" />,
    title: 'Enhance AI',
    description: 'Perbaiki pencahayaan, noise, dan tone foto hanya dengan satu klik berbasis AI.'
  },
  {
    icon: <Image className="h-5 w-5" />,
    title: 'Image → Video',
    description: 'Konversi visual menjadi teaser video vertikal dengan animasi halus otomatis.'
  },
  {
    icon: <Wand2 className="h-5 w-5" />,
    title: 'Caption AI',
    description: 'Caption bilingual dengan tone-of-voice konsisten dan CTA yang bisa disesuaikan.'
  },
  {
    icon: <Layers className="h-5 w-5" />,
    title: 'Galeri & Share',
    description: 'Bagikan aset langsung ke Instagram, TikTok, dan WhatsApp Business dalam satu klik.'
  },
  {
    icon: <Grid className="h-5 w-5" />,
    title: 'Credits & Top-up',
    description: 'Kelola kredit tim, atur limit, dan top up otomatis lewat Midtrans & QRIS.'
  }
];

export function FeatureGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {features.map((feature, idx) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, amount: 0.6 }}
        >
          <CardX tone="surface" padding="lg" interactive className="h-full space-y-4">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                {feature.icon}
              </span>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Workflow terintegrasi dengan n8n, Supabase, dan analitik real-time memastikan tim Anda tetap sinkron.
            </p>
          </CardX>
        </motion.div>
      ))}
    </div>
  );
}
