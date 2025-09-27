'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { templates } from '../data/templates';
import { Button } from './ui/button';

interface Layer {
  id: string;
  label: string;
  x: number;
  y: number;
}

export function EditorCanvas() {
  const [selectedTemplate, setTemplate] = useState(templates[0]);
  const [layers, setLayers] = useState<Layer[]>([
    { id: 'headline', label: 'Headline', x: 40, y: 40 },
    { id: 'subtitle', label: 'Subheadline', x: 40, y: 120 }
  ]);

  const moveLayer = (id: string, direction: 'up' | 'down' | 'left' | 'right') => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== id) return layer;
        const delta = 10;
        switch (direction) {
          case 'up':
            return { ...layer, y: Math.max(0, layer.y - delta) };
          case 'down':
            return { ...layer, y: Math.min(320, layer.y + delta) };
          case 'left':
            return { ...layer, x: Math.max(0, layer.x - delta) };
          case 'right':
            return { ...layer, x: Math.min(320, layer.x + delta) };
        }
      })
    );
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 space-y-4">
        <div className="aspect-square w-full rounded-3xl border border-cacao/20 bg-white/70 p-6 shadow-soft">
          <div
            className="relative h-full w-full rounded-2xl"
            style={{ background: selectedTemplate.background }}
          >
            {layers.map((layer) => (
              <motion.div
                key={layer.id}
                layout
                className="absolute rounded-xl bg-white/80 px-4 py-2 text-charcoal shadow"
                style={{ left: layer.x, top: layer.y }}
              >
                {layer.label}
              </motion.div>
            ))}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-12 grid-rows-12 opacity-10">
              {Array.from({ length: 144 }).map((_, index) => (
                <span key={index} className="border border-white/20" />
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-cacao/20 bg-white/80 p-4 shadow-soft">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-charcoal/60">Layer controls</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {layers.map((layer) => (
              <div key={layer.id} className="rounded-2xl bg-sand/80 p-3">
                <p className="text-sm font-semibold text-charcoal">{layer.label}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => moveLayer(layer.id, 'up')}>
                    ↑
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => moveLayer(layer.id, 'down')}>
                    ↓
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => moveLayer(layer.id, 'left')}>
                    ←
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => moveLayer(layer.id, 'right')}>
                    →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <aside className="w-full max-w-sm space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-charcoal/60">Template aktif</h3>
        <div className="rounded-3xl border border-cacao/10 bg-white/80 p-5 shadow-soft">
          <p className="text-xl font-semibold text-charcoal">{selectedTemplate.name}</p>
          <p className="mt-2 text-sm text-charcoal/70">{selectedTemplate.description}</p>
          <Button className="mt-4 w-full" variant="primary">
            Simpan desain
          </Button>
        </div>
      </aside>
    </div>
  );
}
