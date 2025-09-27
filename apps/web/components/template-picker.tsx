'use client';

import Image from 'next/image';
import { useState } from 'react';
import { templates, type Template } from '../data/templates';

interface TemplatePickerProps {
  onSelect?: (template: Template) => void;
}

export function TemplatePicker({ onSelect }: TemplatePickerProps) {
  const [activeId, setActiveId] = useState(templates[0]?.id ?? '');

  const handleClick = (template: Template) => {
    setActiveId(template.id);
    onSelect?.(template);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => handleClick(template)}
          className="group rounded-3xl border border-cacao/10 bg-white/80 text-left transition hover:-translate-y-1 hover:shadow-soft"
        >
          <div className="relative h-40 w-full overflow-hidden rounded-3xl">
            <Image
              src={template.thumbnail}
              alt={template.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            {activeId === template.id && (
              <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase text-charcoal">
                Aktif
              </span>
            )}
          </div>
          <div className="space-y-1 px-4 py-3">
            <p className="text-base font-semibold text-charcoal">{template.name}</p>
            <p className="text-sm text-charcoal/70">{template.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
