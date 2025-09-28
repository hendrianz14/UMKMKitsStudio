"use client";

import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { CardX, CardXHeader } from '../../../components/ui/cardx';
import { CreditBadge } from '../../../components/credit-badge';
import { UploadDropzone } from '../../../components/upload-dropzone';
import AuthGate from '../../../src/components/auth/AuthGate';

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
  const credits = 320;

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
    <AuthGate>
      <div className="space-y-10">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold text-foreground">Dasbor kreatif Anda</h1>
          <p className="text-sm text-muted-foreground">
            Pantau penggunaan kredit, unggah aset baru, dan kelola job AI terbaru Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <CardX tone="glass" interactive>
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Kredit aktif</p>
                  <p className="text-3xl font-semibold text-foreground">{credits}</p>
                </div>
                <span className="inline-flex h-9 items-center rounded-full bg-primary/15 px-3 text-sm font-medium text-primary">
                  Free Plan
                </span>
              </div>
              <CreditBadge credits={credits} plan="free" />
            </div>
          </CardX>
          <CardX tone="surface" interactive>
            <div className="flex h-full flex-col justify-between gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Job minggu ini</p>
                <p className="text-3xl font-semibold text-foreground">{jobs.length || '—'}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {loading
                  ? 'Memuat aktivitas terbaru...'
                  : jobs.length
                    ? 'Semua job terselesaikan tepat waktu.'
                    : 'Belum ada job baru, coba unggah aset atau jalankan otomatisasi.'}
              </p>
            </div>
          </CardX>
          <CardX tone="surface" interactive>
            <div className="flex h-full flex-col justify-between gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Kredit terpakai</p>
                <p className="text-3xl font-semibold text-foreground">{spendSummary}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Ringkasan otomatis dari job {jobs.length ? 'yang selesai minggu ini.' : 'AI Anda. Pantau limit agar aman.'}
              </p>
            </div>
          </CardX>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <CardX tone="surface" padding="lg">
              <CardXHeader
                title="Unggah aset baru"
                subtitle="File akan dienkripsi sebelum diproses caption dan enhancer AI."
              />
              <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-4">
                <UploadDropzone onUpload={(files) => console.log('Upload', files)} />
              </div>
            </CardX>
            <CardX tone="surface" padding="lg">
              <CardXHeader title="Aksi cepat" subtitle="Mulai otomasi konten hanya dengan sekali klik." />
              <div className="flex flex-wrap gap-3">
                <Button>Buat caption</Button>
                <Button variant="secondary">Top up kredit</Button>
                <Button variant="secondary">Lihat galeri</Button>
              </div>
            </CardX>
          </div>

          <CardX tone="surface" padding="lg" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Riwayat job AI</h2>
              <span className="text-sm text-muted-foreground">{loading ? 'Memuat...' : `${jobs.length} job`}</span>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <ul className="space-y-3">
              {jobs.map((job) => (
                <li
                  key={job.id}
                  className="rounded-xl border border-border bg-background/60 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                      {job.kind}
                    </p>
                    <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                      {new Date(job.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground">
                    Status: <span className="font-semibold text-primary uppercase">{job.status}</span>
                  </p>
                </li>
              ))}
              {!jobs.length && !loading && !error ? (
                <li className="rounded-xl border border-dashed border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                  Belum ada job yang berjalan. Mulai dengan mengunggah foto atau gunakan template favorit.
                </li>
              ) : null}
            </ul>
            <div className="rounded-xl border border-border bg-background/50 p-4 text-sm text-muted-foreground">
              Total kredit dipakai minggu ini: <span className="font-semibold text-foreground">{spendSummary}</span>
            </div>
          </CardX>
        </section>
      </div>
    </AuthGate>
  );
}
