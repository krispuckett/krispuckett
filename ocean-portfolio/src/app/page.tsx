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
  const { scrollY } = useScroll();

  // Hero text fades out quickly (within first 200px of scroll)
  const heroOpacity = useTransform(scrollY, [0, 200], [1, 0]);

  // Navigation fades in after scrolling past hero
  const navOpacity = useTransform(scrollY, [400, 600], [0, 1]);

  return (
    <main className="relative">
      {/* Hero section - full viewport with ocean */}
      <section className="relative h-screen">
        {/* Ocean shader background */}
        <div className="absolute inset-0">
          <OceanCanvas />
        </div>

        {/* Hero text overlay - fades on scroll */}
        <motion.div style={{ opacity: heroOpacity }}>
          <HeroOverlay />
        </motion.div>

        {/* 60px progressive blur gradient at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[60px] pointer-events-none z-10">
          <div className="absolute inset-0 backdrop-blur-[1px]" style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)' }} />
          <div className="absolute inset-0 backdrop-blur-[2px]" style={{ maskImage: 'linear-gradient(to bottom, transparent 25%, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 25%, black 100%)' }} />
          <div className="absolute inset-0 backdrop-blur-[4px]" style={{ maskImage: 'linear-gradient(to bottom, transparent 50%, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 50%, black 100%)' }} />
          <div className="absolute inset-0 backdrop-blur-[8px]" style={{ maskImage: 'linear-gradient(to bottom, transparent 75%, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 75%, black 100%)' }} />
        </div>
      </section>

      {/* Navigation - fades in after scrolling */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50"
        style={{ opacity: navOpacity }}
      >
        <Navigation />
      </motion.div>

      {/* Content section with Unicorn shader */}
      <SiteContent />
    </main>
  );
}
