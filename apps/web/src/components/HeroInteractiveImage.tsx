"use client";
import Image from "next/image";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useRef } from "react";

type Props = { src: string; alt?: string; className?: string };

export default function HeroInteractiveImage({ src, alt = "Preview", className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5), my = useMotionValue(0.5);

  function onPointerMove(e: React.PointerEvent) {
    const b = ref.current?.getBoundingClientRect(); if (!b) return;
    mx.set((e.clientX - b.left) / b.width);
    my.set((e.clientY - b.top) / b.height);
  }

  const rotateX = useTransform(my, [0,1], [8,-8]);
  const rotateY = useTransform(mx, [0,1], [-8,8]);
  const x = useTransform(mx, [0,1], [-10,10]);
  const y = useTransform(my, [0,1], [-10,10]);
  const glowX = useTransform(mx, (v) => `${v * 100}%`);
  const glowY = useTransform(my, (v) => `${v * 100}%`);

  return (
    <motion.div
      ref={ref}
      onPointerMove={onPointerMove}
      className={["relative aspect-[5/3] rounded-2xl overflow-hidden bg-[radial-gradient(60%_60%_at_50%_0%,rgba(59,130,246,.25),rgba(99,102,241,.12)_45%,transparent_100%)]", className].filter(Boolean).join(" ")}
      style={{ transformStyle: "preserve-3d" }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(420px circle at ${glowX} ${glowY}, rgba(59,130,246,.25), rgba(99,102,241,.12) 45%, transparent 60%)`,
        }}
      />
      <motion.div style={{ rotateX, rotateY, x, y }} className="h-full w-full will-change-transform">
        <Image src={src} alt={alt} fill priority sizes="(min-width:1024px) 640px, 100vw" className="object-cover select-none" />
      </motion.div>
    </motion.div>
  );
}
