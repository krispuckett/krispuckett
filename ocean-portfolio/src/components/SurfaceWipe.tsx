'use client';

import { motion, MotionValue, useTransform } from 'framer-motion';

interface SurfaceWipeProps {
  scrollProgress: MotionValue<number>;
}

export default function SurfaceWipe({ scrollProgress }: SurfaceWipeProps) {
  // The wipe band moves from top to bottom of screen
  // Starts above viewport, ends below viewport
  const bandY = useTransform(scrollProgress, [0.05, 0.35], ['-150px', '110vh']);

  // Opacity: visible during the wipe, then fades out
  const opacity = useTransform(scrollProgress, [0.05, 0.1, 0.3, 0.35], [0, 1, 1, 0]);

  return (
    <motion.div
      className="fixed inset-x-0 z-30 pointer-events-none"
      style={{
        y: bandY,
        opacity,
        height: '150px',
      }}
    >
      {/* Blur band with gradient edges */}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
        }}
      />

      {/* Bright edge at bottom (surface light) */}
      <div
        className="absolute bottom-0 inset-x-0 h-[3px]"
        style={{
          background: 'linear-gradient(to right, transparent 5%, rgba(255,255,255,0.6) 30%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.6) 70%, transparent 95%)',
          filter: 'blur(2px)',
        }}
      />

      {/* Subtle caustic shimmer */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(ellipse 100px 50px at 20% 50%, rgba(150,220,255,0.3) 0%, transparent 70%),
            radial-gradient(ellipse 80px 40px at 50% 60%, rgba(150,220,255,0.2) 0%, transparent 70%),
            radial-gradient(ellipse 120px 60px at 80% 40%, rgba(150,220,255,0.25) 0%, transparent 70%)
          `,
        }}
      />
    </motion.div>
  );
}
