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
      </section>

      {/* Progressive blur zone between sections - high z-index to blur both */}
      <div className="relative h-0 z-40">
        <div className="absolute left-0 right-0 bottom-0 h-[100px] -translate-y-1/2 pointer-events-none">
          {/* Strongest blur in the middle */}
          <div className="absolute inset-0 backdrop-blur-[12px]" style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 40%, black 60%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 40%, black 60%, transparent 100%)' }} />
          <div className="absolute inset-0 backdrop-blur-[8px]" style={{ maskImage: 'linear-gradient(to bottom, transparent 10%, black 35%, black 65%, transparent 90%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 10%, black 35%, black 65%, transparent 90%)' }} />
          <div className="absolute inset-0 backdrop-blur-[4px]" style={{ maskImage: 'linear-gradient(to bottom, transparent 20%, black 30%, black 70%, transparent 80%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 20%, black 30%, black 70%, transparent 80%)' }} />
        </div>
      </div>

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
