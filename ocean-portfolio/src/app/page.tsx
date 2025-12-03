'use client';

import { useScroll, useTransform, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import HeroOverlay from '@/components/HeroOverlay';
import DiveTransition from '@/components/DiveTransition';
import Navigation from '@/components/Navigation';
import SiteContent from '@/components/SiteContent';

// Dynamic import for OceanCanvas to avoid SSR issues with Three.js
const OceanCanvas = dynamic(() => import('@/components/OceanCanvas'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-gradient-to-b from-[#1a3a5c] to-[#0a1a2e]" />
  ),
});

function OceanScene() {
  const { scrollYProgress } = useScroll();

  // Camera Y position for dive effect - goes down as we scroll
  const cameraY = useTransform(scrollYProgress, [0, 0.4], [0, -15]);

  // Ocean shader opacity - fades out after dive
  const oceanOpacity = useTransform(scrollYProgress, [0.3, 0.5], [1, 0]);

  return (
    <motion.div style={{ opacity: oceanOpacity }} className="fixed inset-0 z-0">
      <OceanCanvas cameraY={cameraY.get()} isActive={true} />
    </motion.div>
  );
}

function HeroSection() {
  const { scrollYProgress } = useScroll();

  // Hero overlay opacity (fades out as we dive)
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <motion.div style={{ opacity: heroOpacity }}>
      <HeroOverlay opacity={1} />
    </motion.div>
  );
}

export default function Home() {
  return (
    <main className="relative">
      {/* Ocean shader background */}
      <OceanScene />

      {/* Hero overlay text */}
      <HeroSection />

      {/* Navigation */}
      <Navigation />

      {/* Spacer for scroll - this creates the dive effect */}
      <div className="h-[60vh]" />

      {/* Dive transition and content */}
      <DiveTransition>
        <SiteContent />
      </DiveTransition>
    </main>
  );
}
