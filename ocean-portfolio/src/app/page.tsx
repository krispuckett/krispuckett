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

  // Transform values for scroll animations
  // Shader fades out as user scrolls
  const shaderOpacityTransform = useTransform(scrollYProgress, [0.2, 0.4], [1, 0]);
  // Hero text fades out first
  const heroOpacityTransform = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  // Content slides up into view
  const contentY = useTransform(scrollYProgress, [0.15, 0.4], ['100vh', '0vh']);
  const contentOpacity = useTransform(scrollYProgress, [0.2, 0.35], [0, 1]);

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
        <OceanCanvas isActive={isShaderActive} />
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

      {/* Scroll spacer - creates scroll distance before content */}
      <div className="h-[100vh]" />

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
