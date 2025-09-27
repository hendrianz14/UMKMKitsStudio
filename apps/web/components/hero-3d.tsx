'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Hero3DCanvas = dynamic(() => import('./hero-3d-canvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-3xl bg-gradient-to-br from-sand to-[#fbe0be]">
      <span className="text-sm font-semibold uppercase tracking-[0.3em] text-charcoal/70">Loading 3D preview</span>
    </div>
  )
});

function supportsWebGL() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    );
  } catch (err) {
    return false;
  }
}

export function Hero3D() {
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    setCanRender(supportsWebGL());
  }, []);

  if (!canRender) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-3xl bg-gradient-to-br from-sand to-[#fbe0be]">
        <div className="max-w-sm space-y-2 text-center text-charcoal">
          <p className="text-lg font-semibold">Visual interaktif</p>
          <p className="text-sm text-charcoal/70">
            Peramban Anda tidak mendukung WebGL. Nikmati tampilan statis ini atau buka di perangkat lain.
          </p>
        </div>
      </div>
    );
  }

  return <Hero3DCanvas />;
}
