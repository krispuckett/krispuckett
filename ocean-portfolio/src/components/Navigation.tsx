'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';

export default function Navigation() {
  const { scrollYProgress } = useScroll();

  // Navigation appears after diving
  const navOpacity = useTransform(scrollYProgress, [0.3, 0.45], [0, 1]);
  const navY = useTransform(scrollYProgress, [0.3, 0.45], [-20, 0]);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 px-8 py-6"
      style={{
        opacity: navOpacity,
        y: navY,
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="text-white font-semibold text-lg hover:text-white/80 transition-colors"
        >
          KP
        </Link>

        <div className="flex items-center gap-8">
          <Link
            href="#work"
            className="text-white/80 hover:text-white transition-colors text-sm"
          >
            Work
          </Link>
          <Link
            href="#words"
            className="text-white/80 hover:text-white transition-colors text-sm"
          >
            Words
          </Link>
          <Link
            href="#contact"
            className="text-white/80 hover:text-white transition-colors text-sm"
          >
            Let&apos;s Chat
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
