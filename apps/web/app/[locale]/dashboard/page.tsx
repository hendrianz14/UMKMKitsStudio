'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { CreditBadge } from '../../../components/credit-badge';
import { UploadDropzone } from '../../../components/upload-dropzone';

interface JobItem {
  id: string;
  kind: string;
  status: string;
  createdAt: string;
}

const CREDIT_COST: Record<string, number> = {
  caption: 1,
  img_enhance: 5,
  img2img: 10,
  img2video: 30
};

export default function DashboardPage() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE;
    if (!base) {
      setError('NEXT_PUBLIC_API_BASE belum disetel.');
      return;
    }
    setLoading(true);
    fetch(`${base}/api/ai/jobs?limit=5`, {
      credentials: 'include'
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Gagal memuat job.');
        return response.json();
      })
      .then((payload) => {
        setJobs(payload.data ?? []);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Gagal memuat job.');
      })
      .finally(() => setLoading(false));
  }, []);

  const spendSummary = useMemo(() => {
    return jobs.reduce((total, job) => total + (CREDIT_COST[job.kind] ?? 0), 0);
  }, [jobs]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 rounded-3xl border border-cacao/10 bg-white/80 p-8 shadow-soft lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal">Dasbor kreatif Anda</h1>
          <p className="mt-2 text-sm text-charcoal/70">
            Pantau penggunaan kredit dan kelola job AI terbaru Anda.
          </p>
        </div>
        <CreditBadge credits={320} plan="free" />
      </div>

      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-cacao/10 bg-white/80 p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-charcoal">Unggah aset baru</h2>
            <p className="mt-2 text-sm text-charcoal/70">
              File akan terenkripsi dengan AES-GCM sebelum diproses layanan caption AI.
            </p>
            <div className="mt-6">
              <UploadDropzone onUpload={(files) => console.log('Upload', files)} />
            </div>
          </div>
          <div className="rounded-3xl border border-cacao/10 bg-white/80 p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-charcoal">Aksi cepat</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="default">Buat caption</Button>
              <Button variant="secondary">Top up kredit</Button>
              <Button variant="secondary">Lihat galeri</Button>
            </div>
          </div>
        </div>

        <aside className="space-y-4 rounded-3xl border border-cacao/10 bg-white/80 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-charcoal">Riwayat job AI</h2>
            <span className="text-sm text-charcoal/60">{loading ? 'Memuat...' : `${jobs.length} job`}</span>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li key={job.id} className="rounded-2xl border border-cacao/10 bg-sand/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-widest text-charcoal/70">{job.kind}</p>
                  <span className="text-xs text-charcoal/60">{new Date(job.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-sm text-charcoal">
                  Status: <span className="font-semibold uppercase">{job.status}</span>
                </p>
              </li>
            ))}
            {!jobs.length && !loading && !error && (
              <li className="rounded-2xl border border-dashed border-cacao/20 p-4 text-sm text-charcoal/60">
                Belum ada job yang berjalan. Mulai dengan mengunggah foto atau gunakan template favorit.
              </li>
            )}
          </ul>
          <div className="rounded-2xl bg-sand/80 p-4 text-sm text-charcoal">
            Total kredit dipakai minggu ini: <span className="font-semibold">{spendSummary}</span>
          </div>
        </aside>
      </section>
    </div>
  );
}
