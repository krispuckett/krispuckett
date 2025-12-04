'use client';

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
  return (
    <main className="relative">
      {/* Hero section - full viewport with ocean */}
      <section className="relative h-screen">
        {/* Ocean shader background */}
        <div className="absolute inset-0">
          <OceanCanvas />
        </div>

        {/* Hero text overlay */}
        <HeroOverlay />
      </section>

      {/* Navigation - always visible */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>

      {/* Content section - just scrolls naturally */}
      <SiteContent />
    </main>
  );
}
