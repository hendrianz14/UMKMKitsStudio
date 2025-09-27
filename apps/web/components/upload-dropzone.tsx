'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImageUp } from 'lucide-react';
import { Button } from './ui/button';

interface UploadDropzoneProps {
  onUpload: (files: File[]) => void;
  disabled?: boolean;
}

export function UploadDropzone({ onUpload, disabled }: UploadDropzoneProps) {
  const [isHovering, setHovering] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      onUpload(acceptedFiles);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'image/*': []
    },
    disabled
  });

  return (
    <div
      {...getRootProps()}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-cacao/40 bg-white/70 px-6 py-12 text-center transition hover:border-cacao hover:bg-white"
    >
      <input {...getInputProps()} />
      <ImageUp className="h-10 w-10 text-accent transition group-hover:scale-110" />
      <div className="space-y-2">
        <p className="text-lg font-semibold text-charcoal">
          {isDragActive ? 'Lepaskan untuk unggah' : 'Tarik & letakkan foto produk'}
        </p>
        <p className="text-sm text-charcoal/60">
          Format gambar hingga 25MB. File akan terenkripsi sebelum dikirim ke layanan AI.
        </p>
      </div>
      <Button type="button" variant="secondary" disabled={disabled}>
        Pilih berkas
      </Button>
      {isHovering && <span className="text-xs uppercase tracking-widest text-accent">Bisa multi upload</span>}
    </div>
  );
}
