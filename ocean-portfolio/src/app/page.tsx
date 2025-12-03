'use client';

import { useScroll, useTransform, motion, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import HeroOverlay from '@/components/HeroOverlay';
import Navigation from '@/components/Navigation';
import SiteContent from '@/components/SiteContent';
import SurfaceWipe from '@/components/SurfaceWipe';
import UnderwaterOverlay from '@/components/UnderwaterOverlay';

// Dynamic import for OceanCanvas to avoid SSR issues with Three.js
const OceanCanvas = dynamic(() => import('@/components/OceanCanvas'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-gradient-to-b from-[#1a3a5c] to-[#0a1a2e]" />
  ),
});

export default function Home() {
  const { scrollYProgress } = useScroll();
  const [isShaderActive, setIsShaderActive] = useState(true);

  // Layer 5: Ocean shader - fades out during dive (10-30%)
  const shaderOpacity = useTransform(scrollYProgress, [0.1, 0.3], [1, 0]);

  // Layer 6: Hero text - fades out first (0-10%)
  const heroOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

  // Content animations - slides up into view
  const contentY = useTransform(scrollYProgress, [0.25, 0.5], ['100vh', '0vh']);
  const contentOpacity = useTransform(scrollYProgress, [0.3, 0.45], [0, 1]);

  // Pause shader when not visible for performance
  useMotionValueEvent(shaderOpacity, 'change', (latest) => {
    setIsShaderActive(latest > 0.01);
  });

  return (
    <main className="relative">
      {/* Layer 1: Deep ocean background - always visible */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(to bottom, #0a1e3a 0%, #051525 50%, #020a10 100%)',
        }}
      />

      {/* Layer 2: Site content - starts below fold */}
      <motion.div
        className="fixed inset-0 z-10 overflow-auto"
        style={{
          y: contentY,
          opacity: contentOpacity,
        }}
      >
        <div className="min-h-screen bg-[#1a1a1a]">
          <SiteContent />
        </div>
      </motion.div>

      {/* Layer 3: Underwater overlay - blue tint with caustics */}
      <UnderwaterOverlay scrollProgress={scrollYProgress} />

      {/* Layer 4: Surface wipe - blur band that moves down */}
      <SurfaceWipe scrollProgress={scrollYProgress} />

      {/* Layer 5: Ocean shader - fixed, fades out during dive */}
      <motion.div
        className="fixed inset-0 z-40"
        style={{ opacity: shaderOpacity }}
      >
        <OceanCanvas isActive={isShaderActive} />
      </motion.div>

      {/* Layer 6: Hero text overlay - fades out first */}
      <motion.div
        className="fixed inset-0 z-50 pointer-events-none"
        style={{ opacity: heroOpacity }}
      >
        <HeroOverlay />
      </motion.div>

      {/* Navigation - highest z-index */}
      <div className="relative z-[60]">
        <Navigation />
      </div>

      {/* Scroll spacer - creates the dive scroll distance */}
      <div className="h-[200vh]" />
    </main>
  );
}
