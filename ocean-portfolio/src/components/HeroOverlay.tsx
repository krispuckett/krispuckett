'use client';

import { motion } from 'framer-motion';

// Bird icon SVG component
function BirdIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M21.97 10.57L18 6.6V4c0-.55-.45-1-1-1h-2c-.55 0-1 .45-1 1v.6L12.41 3c-.38-.38-1.05-.38-1.42 0l-9.01 9c-.38.37-.38 1.04 0 1.41.19.19.44.29.71.29s.51-.1.71-.29L12 4.83l8.59 8.58c.39.39 1.02.39 1.41 0 .38-.37.38-1.04-.03-1.41zM12 8l-6 6v5c0 .55.45 1 1 1h3v-4h4v4h3c.55 0 1-.45 1-1v-5l-6-6z" />
    </svg>
  );
}

interface HeroOverlayProps {
  opacity?: number;
}

export default function HeroOverlay({ opacity = 1 }: HeroOverlayProps) {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center z-10 pointer-events-none px-8"
      style={{ opacity }}
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-3xl">
        <motion.h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          World&apos;s most optimistic
          <br />
          design leader.*
          <br />
          <span className="text-white/90">
            I grow thriving design
            <br />
            teams through craft
            <br />
            and coaching.
          </span>
        </motion.h1>
      </div>

      {/* Bird icon at bottom center */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-60"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
