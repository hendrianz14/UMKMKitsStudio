import Image from 'next/image';
import type { ReactNode } from 'react';
import { CardX } from '../../../components/ui/cardx';
import { templates } from '../../../data/templates';

export const dynamic = 'force-dynamic';

const demoAssets = templates.map((template, index) => ({
  id: `${template.id}-${index}`,
  url: template.thumbnail,
  title: template.name
}));

export default async function GalleryPage({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<ReactNode> {
  await params;
  return (
    <div className="space-y-8">
      <CardX tone="surface" padding="lg" className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Galeri aset</h1>
        <p className="text-sm text-muted-foreground">
          Semua hasil job AI Anda akan muncul di sini setelah verifikasi webhook n8n.
        </p>
      </CardX>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {demoAssets.map((asset) => (
          <CardX key={asset.id} tone="surface" padding="md" className="space-y-3">
            <div className="relative h-48 w-full overflow-hidden rounded-xl">
              <Image src={asset.url} alt={asset.title} fill className="object-cover" />
            </div>
            <p className="text-sm font-semibold text-foreground">{asset.title}</p>
          </CardX>
        ))}
      </div>
    </div>
  );
}
