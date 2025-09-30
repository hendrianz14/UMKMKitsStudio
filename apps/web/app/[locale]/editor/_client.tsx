'use client';

import { useMemo } from 'react';
import { Sparkles, Wand2 } from 'lucide-react';
import { EditorProvider, EditorCanvas } from '@/components/editor/EditorCanvas';
import { Toolbar } from '@/components/editor/Toolbar';
import { LayersPanel } from '@/components/editor/LayersPanel';
import { TemplatePicker } from '@/components/editor/TemplatePicker';
import { JobStatusToast } from '@/components/editor/JobStatusToast';

const tips = [
  'Gunakan mode Pan untuk menggeser kanvas pada layar kecil. Tekan tombol di toolbar untuk mengaktifkan.',
  'Klik dua kali teks untuk mengedit langsung. Font, warna, dan alignment dapat diatur di panel Layer.',
  'Aksi AI akan mengirim job ke Functions. Statusnya muncul sebagai toast real-time di bagian atas layar.'
];

export default function EditorPage() {
  const info = useMemo(() => tips, []);

  return (
    <EditorProvider>
      <JobStatusToast />
      <div className="space-y-8">
        <section className="rounded-2xl border border-white/10 bg-surface/70 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-white">Editor Visual Interaktif</h1>
              <p className="text-sm text-[var(--text-muted)]">
                Susun konten promosi dengan grid 8px, preset kanvas, dan filter adaptif. Semua perubahan disinkronkan secara instan di browser.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
                <Sparkles className="h-4 w-4 text-primary" /> Enhance / Caption AI siap pakai
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
                <Wand2 className="h-4 w-4 text-primary" /> Export → Supabase Storage otomatis
              </span>
            </div>
          </div>
          <ul className="mt-6 grid gap-3 text-xs text-[var(--text-muted)] md:grid-cols-3">
            {info.map((tip) => (
              <li key={tip} className="rounded-xl border border-white/10 bg-white/5 p-3">
                {tip}
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Toolbar />
            <EditorCanvas />
          </div>
          <div className="space-y-6">
            <LayersPanel />
            <TemplatePicker />
          </div>
        </div>
      </div>
    </EditorProvider>
  );
}
