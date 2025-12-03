'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface DiveTransitionProps {
  children: React.ReactNode;
}

export default function DiveTransition({ children }: DiveTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  // Water surface distortion effect as we break through
  const distortionOpacity = useTransform(scrollYProgress, [0.15, 0.25, 0.35], [0, 1, 0]);
  const distortionScale = useTransform(scrollYProgress, [0.15, 0.3], [0.8, 1.2]);

  // Underwater gradient overlay
  const underwaterOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 0.7]);

  // Content fade in
  const contentOpacity = useTransform(scrollYProgress, [0.25, 0.45], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.25, 0.45], [50, 0]);

  return (
    <div ref={containerRef}>
      {/* Water surface distortion effect */}
      <motion.div
        className="fixed inset-0 z-20 pointer-events-none"
        style={{
          opacity: distortionOpacity,
          scale: distortionScale,
          background:
            'radial-gradient(ellipse at center, rgba(100, 200, 255, 0.3) 0%, rgba(0, 100, 150, 0.5) 50%, transparent 70%)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Underwater gradient overlay */}
      <motion.div
        className="fixed inset-0 z-15 pointer-events-none"
        style={{
          opacity: underwaterOpacity,
          background:
            'linear-gradient(to bottom, rgba(0, 40, 80, 0.9) 0%, rgba(0, 20, 50, 0.95) 50%, rgba(0, 10, 30, 1) 100%)',
        }}
      />

      {/* Content that fades in underwater */}
      <motion.div
        className="relative z-30"
        style={{
          opacity: contentOpacity,
          y: contentY,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
