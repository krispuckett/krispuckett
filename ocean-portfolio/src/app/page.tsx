'use client';

import { useScroll, useTransform, motion, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';
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
  const [isShaderActive, setIsShaderActive] = useState(true);
  const [diveProgress, setDiveProgress] = useState(0);

  // Transform values based on dive progress
  // Shader fades out as we dive deeper
  const shaderOpacityTransform = useTransform(scrollYProgress, [0.4, 0.6], [1, 0]);
  // Hero text fades out early in the dive
  const heroOpacityTransform = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  // Content slides up as we finish diving
  const contentY = useTransform(scrollYProgress, [0.4, 0.7], ['100vh', '0vh']);
  const contentOpacity = useTransform(scrollYProgress, [0.5, 0.65], [0, 1]);

  // Track dive progress from scroll position
  // diveProgress: 0 = at top, 1 = scrolled 100vh (full dive zone)
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    // Map scrollYProgress to diveProgress
    // scrollYProgress 0-0.5 maps to diveProgress 0-1
    const progress = Math.min(1, latest / 0.5);
    setDiveProgress(progress);
  });

  // Pause shader when scrolled past for performance
  useMotionValueEvent(shaderOpacityTransform, 'change', (latest) => {
    setIsShaderActive(latest > 0.01);
  });

  return (
    <main className="relative">
      {/* Ocean shader background - fixed, fades out on scroll */}
      <motion.div
        className="fixed inset-0 z-0"
        style={{ opacity: shaderOpacityTransform }}
      >
        <OceanCanvas isActive={isShaderActive} diveProgress={diveProgress} />
      </motion.div>

      {/* Hero overlay text - fixed, fades out first */}
      <motion.div
        className="fixed inset-0 z-10 pointer-events-none"
        style={{ opacity: heroOpacityTransform }}
      >
        <HeroOverlay />
      </motion.div>

      {/* Navigation - appears after scroll */}
      <Navigation />

      {/* Scroll spacer - creates the "dive" scroll distance */}
      <div className="h-[150vh]" />

      {/* Main content - scrolls up into view */}
      <motion.div
        className="relative z-20 bg-[#1a1a1a]"
        style={{
          y: contentY,
          opacity: contentOpacity,
        }}
      >
        <SiteContent />
      </motion.div>
    </main>
  );
}
