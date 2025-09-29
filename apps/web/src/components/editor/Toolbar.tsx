'use client';

import { useState } from 'react';
import { Download, FlipHorizontal2, FlipVertical2, ImageDown, Loader2, Move, RotateCw, Sparkles, Wand2 } from 'lucide-react';
import { toBlob } from 'html-to-image';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/toast';
import { useEditor } from '@/components/editor/EditorCanvas';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';

const enhanceSchema = z.object({ imageUrl: z.string().url() });
const captionSchema = z.object({ prompt: z.string().min(3) });
const img2imgSchema = z.object({ imageUrl: z.string().url(), prompt: z.string().min(3) });

async function uploadBlob(blob: Blob, format: 'png' | 'jpeg') {
  const supabase = getSupabaseBrowserClient();
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'assets';
  const extension = format === 'png' ? 'png' : 'jpg';
  const fallbackUrl = URL.createObjectURL(blob);

  if (!supabase) {
    setTimeout(() => URL.revokeObjectURL(fallbackUrl), 60_000);
    return { url: fallbackUrl };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id ?? 'anonymous';
    const path = `outputs/${userId}/${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, blob, { contentType: format === 'png' ? 'image/png' : 'image/jpeg' });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
    const url = publicUrlData?.publicUrl;
    if (!url) {
      throw new Error('Tidak dapat mengambil URL publik.');
    }

    try {
      await supabase
        .from('assets')
        .insert({
          user_id: sessionData.session?.user?.id ?? null,
          url,
          format,
          path,
        });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[toolbar] Gagal mencatat metadata aset', error);
      }
    }

    setTimeout(() => URL.revokeObjectURL(fallbackUrl), 60_000);
    return { url };
  } catch (error) {
    console.warn('[toolbar] Gagal mengunggah ke Supabase Storage', error);
    setTimeout(() => URL.revokeObjectURL(fallbackUrl), 60_000);
    return { url: fallbackUrl };
  }
}

export function Toolbar() {
  const {
    state: { canvas, zoom, filters, panMode, layers, activeLayerId },
    presets,
    artboardRef,
    actions: { setCanvasPreset, setZoom, setFilters, setPanMode, rotateCanvas, toggleFlip, upsertJob }
  } = useEditor();
  const [exporting, setExporting] = useState<'png' | 'jpeg' | null>(null);
  const [runningAction, setRunningAction] = useState<'enhance' | 'img2img' | 'caption' | null>(null);

  const handleExport = async (format: 'png' | 'jpeg') => {
    if (!artboardRef.current) {
      toast.error('Kanvas belum siap diexport.');
      return;
    }
    setExporting(format);
    const toastId = toast.loading('Menyiapkan export...');
    try {
      const blob = await toBlob(artboardRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0B0F1A'
      });
      if (!blob) throw new Error('Gagal menghasilkan gambar.');
      const { url } = await uploadBlob(blob, format);
      toast.success('Export berhasil! 👏', {
        id: toastId,
        description: 'Desain tersimpan. Klik untuk membuka galeri.',
        action: {
          label: 'Lihat',
          onClick: () => window.open(url, '_blank', 'noopener,noreferrer')
        }
      });
    } catch (error) {
      console.error(error);
      toast.error('Export gagal. Coba lagi.', { id: toastId });
    } finally {
      setExporting(null);
    }
  };

  const triggerAI = async (action: 'enhance' | 'img2img' | 'caption') => {
    const baseUrl = (process.env.NEXT_PUBLIC_API_BASE ?? '').replace(/\/$/, '') || '/api';
    setRunningAction(action);
    const jobId = crypto.randomUUID();
    const imageLayer = layers.find((layer) => layer.type === 'image' && layer.visible) as typeof layers[number] | undefined;
    const primaryText = layers.find((layer) => layer.type === 'text' && layer.id === activeLayerId);

    try {
      let body: Record<string, unknown> = {};
      if (action === 'enhance') {
        const parsed = enhanceSchema.safeParse({ imageUrl: (imageLayer as any)?.src ?? '' });
        if (!parsed.success) {
          throw new Error('Tambahkan foto produk untuk menjalankan Enhance AI.');
        }
        body = parsed.data;
      }
      if (action === 'caption') {
        const parsed = captionSchema.safeParse({ prompt: primaryText ? (primaryText as any).text : 'Produk UMKM unggulan' });
        if (!parsed.success) {
          throw new Error('Tambahkan teks utama sebelum membuat caption.');
        }
        body = parsed.data;
      }
      if (action === 'img2img') {
        const parsed = img2imgSchema.safeParse({
          imageUrl: (imageLayer as any)?.src ?? '',
          prompt: primaryText ? (primaryText as any).text : 'brand visual upgrade'
        });
        if (!parsed.success) {
          throw new Error('Lengkapi foto dan teks deskripsi untuk Image-to-Image.');
        }
        body = parsed.data;
      }

      upsertJob({ id: jobId, action, status: 'pending', message: 'Job dikirim ke AI.' });
      const response = await fetch(`${baseUrl}/editor/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request gagal.' }));
        throw new Error(error.message ?? 'Request gagal.');
      }

      const result = await response.json().catch(() => ({}));
      upsertJob({
        id: jobId,
        action,
        status: 'success',
        message: result.message ?? 'Job selesai diproses.',
        url: result.url
      });
    } catch (error) {
      upsertJob({ id: jobId, action, status: 'error', message: (error as Error).message });
    } finally {
      setRunningAction(null);
    }
  };

  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-surface/70 p-5 text-sm text-[var(--text-muted)]">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={canvas.presetId} onValueChange={setCanvasPreset}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Preset kanvas" />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.label} ({preset.width}×{preset.height})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant={panMode ? 'default' : 'secondary'}
            onClick={() => setPanMode(!panMode)}
            className="gap-2"
          >
            <Move className="h-4 w-4" /> {panMode ? 'Mode Pan aktif' : 'Aktifkan Pan'}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.3em] text-white/70">Zoom {Math.round(zoom * 100)}%</span>
          <Slider value={[zoom]} min={0.3} max={2} step={0.05} onValueChange={(value) => setZoom(value[0] ?? zoom)} />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => rotateCanvas(90)}>
            <RotateCw className="h-4 w-4" /> Putar 90°
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toggleFlip('horizontal')} aria-label="Flip horizontal">
            <FlipHorizontal2 className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toggleFlip('vertical')} aria-label="Flip vertical">
            <FlipVertical2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">Brightness</p>
          <Slider value={[filters.brightness]} min={50} max={150} step={1} onValueChange={(value) => setFilters({ brightness: value[0] ?? filters.brightness })} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">Contrast</p>
          <Slider value={[filters.contrast]} min={50} max={150} step={1} onValueChange={(value) => setFilters({ contrast: value[0] ?? filters.contrast })} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">Saturation</p>
          <Slider value={[filters.saturation]} min={50} max={160} step={1} onValueChange={(value) => setFilters({ saturation: value[0] ?? filters.saturation })} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={() => handleExport('png')}
            disabled={Boolean(exporting)}
          >
            {exporting === 'png' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} PNG
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={() => handleExport('jpeg')}
            disabled={Boolean(exporting)}
          >
            {exporting === 'jpeg' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageDown className="h-4 w-4" />} JPG
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={() => triggerAI('enhance')}
            disabled={runningAction !== null}
          >
            {runningAction === 'enhance' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Enhance
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={() => triggerAI('img2img')}
            disabled={runningAction !== null}
          >
            {runningAction === 'img2img' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Img→Img
          </Button>
          <Button
            variant="default"
            size="sm"
            className="gap-2"
            onClick={() => triggerAI('caption')}
            disabled={runningAction !== null}
          >
            {runningAction === 'caption' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Caption AI
          </Button>
        </div>
      </div>
    </div>
  );
}
