'use client';

import { useScroll, useTransform, motion } from 'framer-motion';
import { useRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Hero text fades out first as you start scrolling
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  // Ocean shader scales up (like zooming in) and fades as you "dive" through
  const shaderOpacity = useTransform(scrollYProgress, [0.1, 0.4], [1, 0]);
  const shaderScale = useTransform(scrollYProgress, [0, 0.4], [1, 1.15]);

  // Content scales up from smaller size and fades in - creates "emerging" effect
  const contentOpacity = useTransform(scrollYProgress, [0.2, 0.5], [0, 1]);
  const contentScale = useTransform(scrollYProgress, [0.2, 0.5], [0.92, 1]);
  const contentBlur = useTransform(scrollYProgress, [0.2, 0.45], [8, 0]);

  // After transition, content becomes scrollable
  const contentY = useTransform(scrollYProgress, [0.5, 1], ['0vh', '-50vh']);

  return (
    <main className="relative">
      {/* Scroll trigger container */}
      <div ref={containerRef} className="h-[300vh]">
        {/* Fixed layers for the hero experience */}
        <div className="fixed inset-0 z-0">
          {/* Deep ocean background that persists */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, #0d1f2d 0%, #0a1520 40%, #050a0f 100%)',
            }}
          />
        </div>

        {/* Ocean shader - scales up and fades as you dive through */}
        <motion.div
          className="fixed inset-0 z-10 origin-center"
          style={{
            opacity: shaderOpacity,
            scale: shaderScale,
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

        {/* Content layer - fixed, scales up and fades in */}
        <motion.div
          className="fixed inset-0 z-30 overflow-hidden"
          style={{
            opacity: contentOpacity,
          }}
        >
          <motion.div
            className="absolute inset-0 origin-center bg-[#151515]"
            style={{
              scale: contentScale,
              filter: useTransform(contentBlur, (v) => `blur(${v}px)`),
              y: contentY,
            }}
          >
            <SiteContent />
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
