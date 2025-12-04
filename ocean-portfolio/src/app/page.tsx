'use client';

import { useScroll, useTransform, motion, useMotionValueEvent } from 'framer-motion';
import { useRef, useState } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [transitionComplete, setTransitionComplete] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Track when transition is complete
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    setTransitionComplete(latest > 0.95);
  });

  // Ocean surface: visible at start, blurs and fades as you dive
  const oceanOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const oceanBlur = useTransform(scrollYProgress, [0.2, 0.5], [0, 20]);

  // Hero text: fades out early
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  // Underwater content: starts blurred and invisible, sharpens as you dive
  const contentOpacity = useTransform(scrollYProgress, [0.2, 0.6], [0, 1]);
  const contentBlur = useTransform(scrollYProgress, [0.2, 0.7], [20, 0]);

  return (
    <main className="relative bg-[#0a1520]">
      {/* Scroll container - this creates the scroll distance for the transition */}
      <div ref={containerRef} className="h-[200vh]">

        {/* Ocean surface layer - fixed, fades and blurs out */}
        <motion.div
          className="fixed inset-0 z-10"
          style={{
            opacity: oceanOpacity,
            filter: useTransform(oceanBlur, (v) => `blur(${v}px)`),
          }}
        >
          <OceanCanvas />
        </motion.div>

        {/* Hero text - fixed, fades out */}
        <motion.div
          className="fixed inset-0 z-20 pointer-events-none"
          style={{ opacity: heroOpacity }}
        >
          <HeroOverlay />
        </motion.div>

        {/* Underwater content layer - fixed during transition, blurs in */}
        <motion.div
          className="fixed inset-0 z-15 overflow-y-auto"
          style={{
            opacity: contentOpacity,
            filter: useTransform(contentBlur, (v) => `blur(${v}px)`),
          }}
        >
          <SiteContent />
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
    </main>
  );
}
