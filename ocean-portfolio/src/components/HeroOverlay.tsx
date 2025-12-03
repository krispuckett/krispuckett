'use client';

import { motion } from 'framer-motion';

interface HeroOverlayProps {
  opacity?: number;
}

export default function HeroOverlay({ opacity = 1 }: HeroOverlayProps) {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col z-10 pointer-events-none"
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
            linear-gradient(to top, rgba(10, 15, 20, 0.6) 0%, transparent 40%),
            linear-gradient(to bottom, rgba(10, 15, 20, 0.2) 0%, transparent 30%)
          `,
        }}
      />

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center px-6 md:px-12">
        <div className="w-full max-w-4xl">
          <motion.h1
            className="text-fluid-hero font-bold text-white leading-[1.1] tracking-[-0.03em] text-shadow-hero"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          >
            World&apos;s most optimistic
            <br />
            design leader.*
          </motion.h1>

          <motion.p
            className="mt-6 text-fluid-xl font-normal text-white/70 leading-relaxed max-w-2xl"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            I grow thriving design teams
            <br />
            through craft and coaching.
          </motion.p>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <span className="text-fluid-xs font-medium tracking-[0.15em] uppercase text-white/50">
          Dive deeper
        </span>
        <motion.div
          className="w-px h-8 bg-gradient-to-b from-white/60 to-transparent origin-top"
          animate={{
            scaleY: [1, 1.3, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
    </motion.div>
  );
}
