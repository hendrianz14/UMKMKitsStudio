'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Suspense, useEffect, useState } from 'react';

const Canvas = dynamic(() => import('@react-three/fiber').then((mod) => mod.Canvas), { ssr: false });
const Float = dynamic(() => import('@react-three/drei').then((mod) => mod.Float), { ssr: false });
const Environment = dynamic(() => import('@react-three/drei').then((mod) => mod.Environment), { ssr: false });
const OrbitControls = dynamic(() => import('@react-three/drei').then((mod) => mod.OrbitControls), { ssr: false });

export function Hero3D() {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      setOk(!!c.getContext('webgl'));
    } catch {
      setOk(false);
    }
  }, []);

  if (!ok) {
    return (
      <div className="h-[420px] rounded-3xl bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.3),_transparent_70%)]" />
    );
  }

  return (
    <motion.div
      className="h-[420px] overflow-hidden rounded-3xl bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.35),_rgba(99,102,241,0.18),_transparent_75%)]"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <Canvas dpr={[1, 1.5]} camera={{ position: [2.4, 1.8, 3.2], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <Suspense fallback={null}>
          <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.8}>
            <mesh>
              <icosahedronGeometry args={[1.2, 1]} />
              <meshStandardMaterial
                metalness={0.3}
                roughness={0.2}
                color="#6366F1"
                emissive="#3B82F6"
                emissiveIntensity={0.25}
              />
            </mesh>
            <mesh position={[1.6, -0.6, -0.4]}>
              <torusKnotGeometry args={[0.4, 0.12, 120, 16]} />
              <meshStandardMaterial color="#8B5CF6" metalness={0.4} roughness={0.25} />
            </mesh>
          </Float>
          <Environment preset="city" />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} enableRotate autoRotate autoRotateSpeed={0.6} />
      </Canvas>
    </motion.div>
  );
}
