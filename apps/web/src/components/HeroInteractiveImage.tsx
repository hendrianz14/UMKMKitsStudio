"use client";
import Image from "next/image";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useRef } from "react";
import { useHydrated } from "../hooks/useHydrated";

type Props = { src: string; alt?: string; className?: string };

export default function HeroInteractiveImage({ src, alt = "Preview", className }: Props) {
  const hydrated = useHydrated();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5), my = useMotionValue(0.5);

  function onPointerMove(e: React.PointerEvent) {
    const b = ref.current?.getBoundingClientRect(); if (!b) return;
    mx.set((e.clientX - b.left) / b.width); my.set((e.clientY - b.top) / b.height);
  }

  const rotateX = useTransform(my, [0,1], [8,-8]);
  const rotateY = useTransform(mx, [0,1], [-8,8]);
  const x = useTransform(mx, [0,1], [-10,10]);
  const y = useTransform(my, [0,1], [-10,10]);

  if (!hydrated) {
    return <div className={["aspect-[5/3] rounded-2xl bg-secondary/30 animate-pulse", className].join(" ")} />;
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onPointerMove}
      className={["relative aspect-[5/3] rounded-2xl overflow-hidden bg-[radial-gradient(60%_60%_at_50%_0%,rgba(59,130,246,.25),rgba(99,102,241,.12)_45%,transparent_100%)]", className].join(" ")}
      style={{ transformStyle: "preserve-3d" }}
    >
      <motion.div style={{ rotateX, rotateY, x, y }} className="h-full w-full will-change-transform">
        <Image src={src} alt={alt} fill priority sizes="(min-width:1024px) 640px, 100vw" className="object-cover select-none" />
      </motion.div>
    </motion.div>
  );
}
