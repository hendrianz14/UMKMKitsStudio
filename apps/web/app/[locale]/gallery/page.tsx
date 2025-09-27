import Image from 'next/image';
import { templates } from '../../../data/templates';

const demoAssets = templates.map((template, index) => ({
  id: `${template.id}-${index}`,
  url: template.thumbnail,
  title: template.name
}));

export default function GalleryPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-cacao/10 bg-white/80 p-6 shadow-soft">
        <h1 className="text-3xl font-semibold text-charcoal">Galeri aset</h1>
        <p className="mt-2 text-sm text-charcoal/70">
          Semua hasil job AI Anda akan muncul di sini setelah verifikasi webhook n8n.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {demoAssets.map((asset) => (
          <figure key={asset.id} className="rounded-3xl border border-cacao/10 bg-white/80 p-4 shadow-soft">
            <div className="relative h-48 w-full overflow-hidden rounded-2xl">
              <Image src={asset.url} alt={asset.title} fill className="object-cover" />
            </div>
            <figcaption className="mt-3 text-sm font-semibold text-charcoal">{asset.title}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
