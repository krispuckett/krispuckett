'use client';

import { motion } from 'framer-motion';

interface HeroOverlayProps {
  opacity?: number;
}

export default function HeroOverlay({ opacity = 1 }: HeroOverlayProps) {
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

      {/* Main content — positioned bottom-left */}
      <div className="absolute bottom-24 left-0 px-8 md:px-16">
        <motion.h1
          className="font-bold text-white leading-[1.0] tracking-[-0.03em] text-shadow-hero max-w-[900px] will-change-transform"
          style={{ fontSize: 'clamp(3.5rem, 10vw, 8rem)' }}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.2,
            type: 'spring',
            stiffness: 100,
            damping: 20,
            mass: 1,
          }}
        >
          World&apos;s most optimistic
          <br />
          design leader.*
        </motion.h1>

        <motion.p
          className="mt-6 font-normal text-white/85 leading-relaxed max-w-[600px] will-change-transform"
          style={{ fontSize: 'clamp(1.25rem, 3vw, 2rem)' }}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.35,
            type: 'spring',
            stiffness: 100,
            damping: 20,
            mass: 1,
          }}
        >
          I grow thriving design teams through craft and coaching.
        </motion.p>
      </div>

      {/* Scroll indicator — centered at bottom */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 will-change-transform"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.6,
          type: 'spring',
          stiffness: 120,
          damping: 20,
        }}
      >
        <span className="text-[12px] font-medium tracking-[0.12em] uppercase text-white/40">
          Dive deeper
        </span>
        <motion.div
          className="w-px h-6 bg-gradient-to-b from-white/40 to-transparent origin-top will-change-transform"
          animate={{
            scaleY: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: [0.455, 0.03, 0.515, 0.955], // ease-in-out-quad
          }}
        />
      </motion.div>
    </motion.div>
  );
}
