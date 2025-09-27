'use client';

import { useMemo, useState } from 'react';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import Image from 'next/image';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useEditor } from './EditorCanvas';
import { templates, type Template } from '../../../data/templates';
import { cn } from '../../../lib/utils';

const columnHelper = createColumnHelper<Template>();

const columns = [
  columnHelper.accessor('name', {
    header: () => <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Template</span>,
    cell: (info) => (
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-white">{info.getValue()}</span>
        <span className="text-xs text-[var(--text-muted)]">{info.row.original.description}</span>
      </div>
    )
  }),
  columnHelper.accessor('category', {
    header: () => <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Kategori</span>,
    cell: (info) => <span className="text-xs text-[var(--text-muted)]">{info.getValue()}</span>
  })
];

export function TemplatePicker() {
  const {
    actions: { applyTemplate }
  } = useEditor();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Template>(templates[0]);

  const filtered = useMemo(() => {
    if (!query) return templates;
    const lower = query.toLowerCase();
    return templates.filter((template) =>
      [template.name, template.description, template.category].some((value) => value.toLowerCase().includes(lower))
    );
  }, [query]);

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="grid gap-5 rounded-2xl border border-white/10 bg-surface/70 p-5 text-sm text-[var(--text-muted)] lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-white">Template Gallery</h3>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari template..."
            className="h-9 w-56"
          />
        </div>
        <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-white/5">
          {table.getRowModel().rows.map((row) => {
            const template = row.original;
            const isActive = template.id === selected.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelected(template)}
                className={cn(
                  'w-full cursor-pointer p-4 text-left transition hover:bg-white/5 focus:outline-none',
                  isActive && 'bg-white/10'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{template.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{template.description}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
                    {template.category}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
          <Image
            src={`${selected.thumbnail}&auto=format&fit=crop&w=600&q=80`}
            alt={selected.name}
            width={600}
            height={600}
            className="h-48 w-full object-cover"
          />
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white">{selected.name}</h4>
          <p className="text-xs text-[var(--text-muted)]">{selected.description}</p>
          <Button onClick={() => applyTemplate(selected)} className="w-full">
            Terapkan ke Kanvas
          </Button>
        </div>
      </div>
    </div>
  );
}
