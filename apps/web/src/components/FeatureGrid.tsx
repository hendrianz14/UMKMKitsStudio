"use client";

import { motion } from 'framer-motion';
import { Brain, Grid, Image, Layers, Sparkles, Wand2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const features = [
  {
    icon: <Sparkles className="h-6 w-6 text-primary" />,
    title: 'Editor Template',
    description: 'Ratusan template siap pakai dengan grid pintar dan sistem warna brand-friendly.'
  },
  {
    icon: <Brain className="h-6 w-6 text-primary" />,
    title: 'Enhance AI',
    description: 'Perbaiki pencahayaan, noise, dan tone foto hanya dengan satu klik berbasis AI.'
  },
  {
    icon: <Image className="h-6 w-6 text-primary" />,
    title: 'Image → Video',
    description: 'Konversi visual menjadi teaser video vertikal dengan animasi halus otomatis.'
  },
  {
    icon: <Wand2 className="h-6 w-6 text-primary" />,
    title: 'Caption AI',
    description: 'Caption bilingual dengan tone-of-voice konsisten dan CTA yang bisa disesuaikan.'
  },
  {
    icon: <Layers className="h-6 w-6 text-primary" />,
    title: 'Galeri & Share',
    description: 'Bagikan aset langsung ke Instagram, TikTok, dan WhatsApp Business dalam satu klik.'
  },
  {
    icon: <Grid className="h-6 w-6 text-primary" />,
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
          <Card className="h-full border-white/5 bg-surface/80">
            <CardHeader className="flex items-start gap-3">
              <div className="rounded-xl bg-white/5 p-3 shadow-inner shadow-white/10">
                {feature.icon}
              </div>
              <div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-[var(--text-muted)]">
              <p>
                Workflow terintegrasi dengan n8n, Firebase, dan analitik real-time memastikan tim Anda tetap sinkron.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
