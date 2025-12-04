'use client';

import { useScroll, useTransform, motion, MotionValue } from 'framer-motion';
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

// Helper to use motion value in clip-path
function useClipPath(progress: MotionValue<number>) {
  return useTransform(progress, [0.04, 0.18], [
    'circle(0% at 50% 40%)',
    'circle(150% at 50% 40%)',
  ]);
}

export default function Home() {
  const { scrollYProgress } = useScroll();

  // Hero text fades out first as you start scrolling
  const heroOpacity = useTransform(scrollYProgress, [0, 0.06], [1, 0]);

  // Ocean shader fades as the portal opens
  const shaderOpacity = useTransform(scrollYProgress, [0.08, 0.16], [1, 0]);

  // Portal clip-path expands from center
  const clipPath = useClipPath(scrollYProgress);

  // Content fades in as portal opens
  const contentOpacity = useTransform(scrollYProgress, [0.06, 0.14], [0, 1]);

  return (
    <main className="relative">
      {/* Fixed deep underwater background - this shows through the portal */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, #0a1a2a 0%, #0d1d2d 30%, #0a1520 100%)',
          }}
        />
      </div>

      {/* Ocean shader - the surface you dive through */}
      <motion.div
        className="fixed inset-0 z-10"
        style={{ opacity: shaderOpacity }}
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

      {/* Underwater content - revealed through expanding portal */}
      <motion.div
        className="fixed inset-0 z-15 overflow-hidden"
        style={{
          clipPath,
          opacity: contentOpacity,
        }}
      >
        {/* Dark vignette overlay for depth feel */}
        <div
          className="absolute inset-0 pointer-events-none z-50"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, transparent 0%, transparent 60%, rgba(5,10,15,0.4) 100%)',
          }}
        />
        <div className="absolute inset-0 overflow-y-auto bg-[#0d1520]">
          <SiteContent />
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>

      {/* Scroll trigger - gives us scroll distance to work with */}
      <div className="h-[400vh]" />
    </main>
  );
}
