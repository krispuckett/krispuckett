'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

// Bird/arrow icon
function BirdIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}

export default function Navigation() {
  const { scrollYProgress } = useScroll();

  // Navigation appears after diving
  const navOpacity = useTransform(scrollYProgress, [0.25, 0.4], [0, 1]);
  const navY = useTransform(scrollYProgress, [0.25, 0.4], [-20, 0]);

  return (
    <motion.nav
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
      style={{
        opacity: navOpacity,
        y: navY,
      }}
    >
      {/* Pill-shaped container */}
      <div className="flex items-center gap-1 bg-[#2a2a2a]/95 backdrop-blur-sm rounded-full px-2 py-2 shadow-lg border border-white/5">
        {/* Bird icon */}
        <Link
          href="/"
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors"
        >
          <BirdIcon className="text-white/80" />
        </Link>

        {/* Nav links */}
        <div className="flex items-center">
          <Link
            href="#"
            className="px-4 py-2 text-white/80 hover:text-white text-sm font-medium transition-colors"
          >
            Home
          </Link>
          <Link
            href="#about"
            className="px-4 py-2 text-white/80 hover:text-white text-sm font-medium transition-colors"
          >
            About
          </Link>
          <Link
            href="#words"
            className="px-4 py-2 text-white/80 hover:text-white text-sm font-medium transition-colors"
          >
            Words
          </Link>
        </div>

        {/* Let's chat button with avatar */}
        <Link
          href="#contact"
          className="flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-full pl-4 pr-2 py-1.5 ml-2 transition-colors"
        >
          <span className="text-white/90 text-sm font-medium">Let&apos;s chat</span>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 overflow-hidden flex items-center justify-center text-white text-xs font-bold">
            KP
          </div>
        </Link>
      </div>
    </motion.nav>
  );
}
