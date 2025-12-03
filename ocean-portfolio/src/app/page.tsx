'use client';

import { useScroll, useTransform, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import HeroOverlay from '@/components/HeroOverlay';
import Navigation from '@/components/Navigation';
import SiteContent from '@/components/SiteContent';

// Dynamic import for OceanCanvas to avoid SSR issues with Three.js
const OceanCanvas = dynamic(() => import('@/components/OceanCanvas'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-gradient-to-b from-[#1a3a5c] to-[#0a1a2e]" />
  ),
});

export default function Home() {
  const { scrollYProgress } = useScroll();

  // Hero text fades out first as you start scrolling
  const heroOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  // Ocean shader fades and scales slightly as you "dive" into it
  const shaderOpacity = useTransform(scrollYProgress, [0.05, 0.25], [1, 0]);
  const shaderScale = useTransform(scrollYProgress, [0, 0.25], [1, 1.1]);
  const shaderBlur = useTransform(scrollYProgress, [0.1, 0.25], [0, 8]);

  // Content rises up from below
  const contentY = useTransform(scrollYProgress, [0.15, 0.4], ['100vh', '0vh']);
  const contentOpacity = useTransform(scrollYProgress, [0.2, 0.35], [0, 1]);

  return (
    <main className="relative">
      {/* Deep ocean background - visible as shader fades */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(to bottom, #0d1f2d 0%, #0a1520 40%, #050a0f 100%)',
        }}
      />

      {/* Site content - rises up from the depths */}
      <motion.div
        className="fixed inset-0 z-10"
        style={{
          y: contentY,
          opacity: contentOpacity,
        }}
      >
        <div className="min-h-screen bg-[#1a1a1a]">
          <SiteContent />
        </div>
      </motion.div>

      {/* Ocean shader - fades, scales, and blurs as you dive through */}
      <motion.div
        className="fixed inset-0 z-40 origin-center"
        style={{
          opacity: shaderOpacity,
          scale: shaderScale,
          filter: useTransform(shaderBlur, (v) => `blur(${v}px)`),
        }}
      >
        <OceanCanvas />
      </motion.div>

      {/* Hero text overlay */}
      <motion.div
        className="fixed inset-0 z-50 pointer-events-none"
        style={{ opacity: heroOpacity }}
      >
        <HeroOverlay />
      </motion.div>

      {/* Navigation */}
      <div className="relative z-[60]">
        <Navigation />
      </div>

      {/* Scroll spacer */}
      <div className="h-[200vh]" />
    </main>
  );
}
