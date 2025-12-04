'use client';

import { motion } from 'framer-motion';

interface HeroOverlayProps {
  opacity?: number;
}

export default function HeroOverlay({ opacity = 1 }: HeroOverlayProps) {
  const heroStyle = {
    fontSize: 'clamp(3rem, 8vw, 6rem)',
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '-0.03em',
    maxWidth: 900,
  };

  return (
    <motion.div
      className="fixed inset-0 z-10 pointer-events-none"
      style={{ opacity }}
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      transition={{ duration: 0.5 }}
    >
      {/* Gradient overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(to top, rgba(10, 15, 20, 0.5) 0%, rgba(10, 15, 20, 0.2) 30%, transparent 50%),
            linear-gradient(to right, rgba(10, 15, 20, 0.3) 0%, transparent 50%)
          `,
        }}
      />

      {/* Hero text */}
      <div className="absolute bottom-24 left-0 px-8 md:px-16">
        <motion.h1
          style={{ ...heroStyle, color: 'white' }}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 100, damping: 20 }}
        >
          World's most optimistic
          <br />
          design leader.*
        </motion.h1>

        <motion.p
          style={{ ...heroStyle, color: 'rgba(255,255,255,0.85)', marginTop: 24 }}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 100, damping: 20 }}
        >
          I grow thriving design teams through craft and coaching.
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 120, damping: 20 }}
      >
        <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
          Dive deeper
        </span>
        <motion.div
          style={{ width: 1, height: 24, background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)' }}
          animate={{ scaleY: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </motion.div>
    </motion.div>
  );
}
