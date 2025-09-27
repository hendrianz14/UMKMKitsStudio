'use client';

import { type ReactNode } from 'react';
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { useEditor, TextLayer, Layer } from './EditorCanvas';
import { cn } from '../../../lib/utils';

const FONT_OPTIONS = [
  'Plus Jakarta Sans',
  'Clash Display',
  'Sora',
  'DM Sans',
  'Inter'
];

const ALIGN_OPTIONS: Array<{ value: TextLayer['align']; icon: ReactNode; label: string }> = [
  { value: 'left', icon: <AlignLeft className="h-4 w-4" />, label: 'Left' },
  { value: 'center', icon: <AlignCenter className="h-4 w-4" />, label: 'Center' },
  { value: 'right', icon: <AlignRight className="h-4 w-4" />, label: 'Right' }
];

function isTextLayer(layer: Layer): layer is TextLayer {
  return layer.type === 'text';
}

export function LayersPanel() {
  const {
    state: { layers, activeLayerId },
    actions: { setActiveLayer, updateLayer, reorderLayer, removeLayer }
  } = useEditor();

  return (
    <aside className="space-y-4 rounded-2xl border border-white/10 bg-surface/70 p-5">
      <header className="flex items-center justify-between text-sm font-semibold text-white">
        <span>Layers</span>
        <span className="text-xs text-[var(--text-muted)]">{layers.length} elemen</span>
      </header>
      <div className="space-y-3">
        {layers.map((layer, index) => {
          const isText = isTextLayer(layer);
          const textLayer = isText ? layer : null;
          const isActive = layer.id === activeLayerId;

          return (
            <div
              key={layer.id}
              className={cn(
                'space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20',
                isActive ? 'border-primary/40 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]' : ''
              )}
              onClick={() => setActiveLayer(layer.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span className="rounded-md bg-white/10 px-2 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
                    {layer.type}
                  </span>
                  {layer.name}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(event) => {
                      event.stopPropagation();
                      reorderLayer(layer.id, 'up');
                    }}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(event) => {
                      event.stopPropagation();
                      reorderLayer(layer.id, 'down');
                    }}
                    disabled={index === layers.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(event) => {
                      event.stopPropagation();
                      updateLayer(layer.id, { visible: !layer.visible });
                    }}
                  >
                    {layer.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-300"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeLayer(layer.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {textLayer ? (
                <div className="space-y-3 text-xs text-[var(--text-muted)]">
                  <Select
                    value={textLayer.fontFamily}
                    onValueChange={(value) => updateLayer(textLayer.id, { fontFamily: value })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="mb-1 text-[10px] uppercase tracking-[0.3em] text-white/70">Ukuran</p>
                      <Slider
                        value={[textLayer.fontSize]}
                        min={20}
                        max={120}
                        step={1}
                        onValueChange={(value) => updateLayer(textLayer.id, { fontSize: value[0] ?? textLayer.fontSize })}
                      />
                    </div>
                    <div className="w-24">
                      <p className="mb-1 text-[10px] uppercase tracking-[0.3em] text-white/70">Weight</p>
                      <Select
                        value={String(textLayer.fontWeight)}
                        onValueChange={(value) => updateLayer(textLayer.id, { fontWeight: Number(value) })}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[300, 400, 500, 600, 700, 800].map((weight) => (
                            <SelectItem key={weight} value={String(weight)}>
                              {weight}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-[0.3em] text-white/70">Warna</label>
                    <Input
                      type="color"
                      value={textLayer.color}
                      onChange={(event) => updateLayer(textLayer.id, { color: event.target.value })}
                      className="h-9 w-16 cursor-pointer border-white/10 bg-transparent p-0"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    {ALIGN_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={textLayer.align === option.value ? 'default' : 'secondary'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={(event) => {
                          event.stopPropagation();
                          updateLayer(textLayer.id, { align: option.value });
                        }}
                      >
                        {option.icon}
                        <span className="sr-only">{option.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
