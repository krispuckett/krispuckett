'use client';

import { useScroll, useTransform, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import HeroOverlay from '@/components/HeroOverlay';
import Navigation from '@/components/Navigation';
import SiteContent from '@/components/SiteContent';

// Dynamic imports for shaders
const OceanCanvas = dynamic(() => import('@/components/OceanCanvas'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-gradient-to-b from-[#1a3a5c] to-[#0a1a2e]" />
  ),
});

const ContentShader = dynamic(() => import('@/components/ContentShader'), {
  ssr: false,
  loading: () => null,
});

export default function Home() {
  const { scrollYProgress } = useScroll();

  // Hero text fades out first
  const heroOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  // Ocean shader fades out to reveal underwater
  const shaderOpacity = useTransform(scrollYProgress, [0.02, 0.12], [1, 0]);

  // Underwater shader fades in
  const underwaterOpacity = useTransform(scrollYProgress, [0.04, 0.12], [0, 1]);

  // Content text fades in
  const contentOpacity = useTransform(scrollYProgress, [0.08, 0.16], [0, 1]);

  return (
    <main className="relative">
      {/* Layer 0: Deep dark background */}
      <div className="fixed inset-0 z-0 bg-[#0a1015]" />

      {/* Layer 1: Underwater caustics shader - always there, fades in */}
      <motion.div
        className="fixed inset-0 z-[5]"
        style={{ opacity: underwaterOpacity }}
      >
        <ContentShader />
      </motion.div>

      {/* Layer 2: Ocean surface shader - fades out as you dive */}
      <motion.div
        className="fixed inset-0 z-10"
        style={{ opacity: shaderOpacity }}
      >
        <OceanCanvas />
      </motion.div>

      {/* Layer 3: Hero text */}
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

      {/* Scroll spacer for hero */}
      <div className="h-[100vh]" />

      {/* Content - transparent background, scrolls over the fixed underwater shader */}
      <motion.div
        className="relative z-30"
        style={{ opacity: contentOpacity }}
      >
        <SiteContent />
      </motion.div>
    </main>
  );
}
