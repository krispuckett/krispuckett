'use client';

import { motion, MotionValue, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

interface UnderwaterOverlayProps {
  scrollProgress: MotionValue<number>;
}

export default function UnderwaterOverlay({ scrollProgress }: UnderwaterOverlayProps) {
  const [time, setTime] = useState(0);

  // Animate caustics pattern
  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      setTime(Date.now() / 1000);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // Overlay fades in after surface wipe, then fades out
  const opacity = useTransform(scrollProgress, [0.15, 0.25, 0.4, 0.5], [0, 0.6, 0.6, 0]);

  // Generate animated caustic positions
  const causticX1 = 20 + Math.sin(time * 0.5) * 10;
  const causticX2 = 50 + Math.cos(time * 0.3) * 15;
  const causticX3 = 80 + Math.sin(time * 0.4) * 12;
  const causticY1 = 30 + Math.cos(time * 0.6) * 10;
  const causticY2 = 50 + Math.sin(time * 0.4) * 15;
  const causticY3 = 70 + Math.cos(time * 0.5) * 10;

  return (
    <motion.div
      className="fixed inset-0 z-[25] pointer-events-none"
      style={{ opacity }}
    >
      {/* Base underwater tint */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(10, 60, 100, 0.4) 0%, rgba(5, 30, 60, 0.5) 100%)',
        }}
      />

      {/* Animated caustics */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(ellipse 200px 100px at ${causticX1}% ${causticY1}%, rgba(100,180,220,0.4) 0%, transparent 60%),
            radial-gradient(ellipse 150px 80px at ${causticX2}% ${causticY2}%, rgba(120,200,240,0.3) 0%, transparent 60%),
            radial-gradient(ellipse 180px 90px at ${causticX3}% ${causticY3}%, rgba(80,160,200,0.35) 0%, transparent 60%)
          `,
        }}
      />

      {/* Light rays from surface */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            linear-gradient(170deg, rgba(150,200,255,0.3) 0%, transparent 30%),
            linear-gradient(160deg, rgba(150,200,255,0.2) 0%, transparent 40%)
          `,
        }}
      />
    </motion.div>
  );
}
