'use client';

import { useState, useEffect } from 'react';

export function useScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
      setScrollProgress(progress);
    };

    // Set initial value
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollProgress;
}

// Get a normalized value for the dive transition (0 = above water, 1 = fully submerged)
export function useDiveProgress() {
  const scrollProgress = useScrollProgress();

  // Dive happens in first 40% of scroll
  // 0-20%: approaching water
  // 20%: breaking surface
  // 20-40%: underwater transition
  // 40%+: fully transitioned to content

  const diveProgress = Math.min(scrollProgress / 0.4, 1);

  return {
    scrollProgress,
    diveProgress,
    isAboveWater: diveProgress < 0.5,
    isBreakingSurface: diveProgress >= 0.4 && diveProgress <= 0.6,
    isUnderwater: diveProgress > 0.5,
    isFullySubmerged: diveProgress >= 1,
  };
}
