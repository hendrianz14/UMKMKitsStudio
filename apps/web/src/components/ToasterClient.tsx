'use client';

import { Toaster } from 'sonner';

export function ToasterClient() {
  return (
    <Toaster richColors position="top-center" closeButton toastOptions={{ duration: 3500 }} />
  );
}
