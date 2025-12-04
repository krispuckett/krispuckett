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
  const heroOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  // Ocean shader fades and scales slightly as you "dive" into it
  const shaderOpacity = useTransform(scrollYProgress, [0.03, 0.15], [1, 0]);
  const shaderScale = useTransform(scrollYProgress, [0, 0.15], [1, 1.05]);
  const shaderBlur = useTransform(scrollYProgress, [0.08, 0.15], [0, 8]);

  return (
    <main className="relative">
      {/* Fixed layers for the hero experience */}
      <div className="fixed inset-0 z-0">
        {/* Deep ocean background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, #0d1f2d 0%, #0a1520 40%, #050a0f 100%)',
          }}
        />
      </div>

      {/* Ocean shader - fades, scales, and blurs as you dive through */}
      <motion.div
        className="fixed inset-0 z-10 origin-center"
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
        className="fixed inset-0 z-20 pointer-events-none"
        style={{ opacity: heroOpacity }}
      >
        <HeroOverlay />
      </motion.div>

      {/* Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>

      {/* Scroll spacer for hero section */}
      <div className="h-[100vh]" />

      {/* Main scrollable content */}
      <div className="relative z-30 bg-[#151515]">
        <SiteContent />
      </div>
    </main>
  );
}
