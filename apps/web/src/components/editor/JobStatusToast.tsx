'use client';

import { useEffect, useRef } from 'react';
import { toast } from '../ui/toast';
import { useEditor } from './EditorCanvas';

export function JobStatusToast() {
  const {
    state: { jobs }
  } = useEditor();
  const toastMap = useRef(new Map<string, string | number>());

  useEffect(() => {
    jobs.forEach((job) => {
      const existing = toastMap.current.get(job.id);
      if (job.status === 'pending') {
        if (existing) {
          toast.loading(job.message ?? 'Job sedang diproses...', { id: existing });
        } else {
          const id = toast.loading(job.message ?? 'Job sedang diproses...');
          toastMap.current.set(job.id, id);
        }
      } else if (job.status === 'success') {
        const id = existing ?? toast.loading('Job selesai');
        toast.success(job.message ?? 'Job selesai', {
          id,
          action: job.url
            ? {
                label: 'Buka',
                onClick: () => window.open(job.url, '_blank', 'noopener,noreferrer')
              }
            : undefined
        });
        toastMap.current.delete(job.id);
      } else if (job.status === 'error') {
        const id = existing ?? toast.loading('Job gagal');
        toast.error(job.message ?? 'Job gagal dijalankan', { id });
        toastMap.current.delete(job.id);
      }
    });
  }, [jobs]);

  return null;
}
