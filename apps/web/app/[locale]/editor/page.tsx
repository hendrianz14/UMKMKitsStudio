'use client';

import { useState } from 'react';
import { EditorCanvas } from '../../../components/editor-canvas';
import { TemplatePicker } from '../../../components/template-picker';
import { templates, type Template } from '../../../data/templates';

export default function EditorPage() {
  const [active, setActive] = useState<Template>(templates[0]);

  return (
    <div className="space-y-10">
      <div className="rounded-3xl border border-cacao/10 bg-white/80 p-6 shadow-soft">
        <h1 className="text-3xl font-semibold text-charcoal">Editor visual</h1>
        <p className="mt-2 text-sm text-charcoal/70">
          Sesuaikan template pilihan Anda. Editor ini mendukung grid dan snap sederhana untuk mempermudah komposisi.
        </p>
      </div>
      <EditorCanvas />
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-charcoal">Pilih template</h2>
        <TemplatePicker onSelect={setActive} />
        <p className="text-sm text-charcoal/60">
          Template aktif: <span className="font-semibold text-charcoal">{active.name}</span>
        </p>
      </section>
    </div>
  );
}
