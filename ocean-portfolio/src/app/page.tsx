'use client';

import { useScroll, useTransform, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import HeroOverlay from '@/components/HeroOverlay';
import Navigation from '@/components/Navigation';
import SiteContent from '@/components/SiteContent';

// Dynamic import for OceanCanvas
const OceanCanvas = dynamic(() => import('@/components/OceanCanvas'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-gradient-to-b from-[#1a3a5c] to-[#0a1a2e]" />
  ),
});

export default function Home() {
  const { scrollYProgress } = useScroll();

  // Hero text fades out as you start scrolling
  const heroOpacity = useTransform(scrollYProgress, [0, 0.03], [1, 0]);

  // Ocean shader fades - but content fades in BEFORE ocean fully fades (crossfade)
  const shaderOpacity = useTransform(scrollYProgress, [0.02, 0.08], [1, 0]);

  // Content fades in early, overlapping with ocean fade
  const contentOpacity = useTransform(scrollYProgress, [0.01, 0.05], [0, 1]);

  return (
    <main className="relative">
      {/* Ocean shader - fixed background */}
      <motion.div
        className="fixed inset-0 z-10"
        style={{ opacity: shaderOpacity }}
      >
        <OceanCanvas />
      </motion.div>

      {/* Hero text */}
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

      {/* Scroll spacer - shorter so content comes up faster */}
      <div className="h-[70vh]" />

      {/* Content with Unicorn shader inside - fades in over the ocean */}
      <motion.div
        className="relative z-30"
        style={{ opacity: contentOpacity }}
      >
        <SiteContent />
      </motion.div>
    </main>
  );
}
