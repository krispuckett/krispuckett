"use client";

import { useEffect, useRef, useState } from "react";

interface OrbData {
  color: string;
  label: string;
  baseY: number; // percentage of viewport height
}

const ORBS_DATA: OrbData[] = [
  { color: "#8B1A1A", label: "The Lord of the Rings · #8B1A1A", baseY: 30 },
  { color: "#2A7B7B", label: "The Odyssey · #2A7B7B", baseY: 50 },
  { color: "#1B5E3B", label: "The Silmarillion · #1B5E3B", baseY: 70 },
];

const SILMARILLION_BLUE = "#2A4858";

export default function Orbs() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [orbPositions, setOrbPositions] = useState(
    ORBS_DATA.map((o) => ({ x: 60, y: o.baseY }))
  );
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? window.scrollY / docHeight : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Ambient drift animation
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const animate = () => {
      timeRef.current += 0.008;
      const t = timeRef.current;

      setOrbPositions(
        ORBS_DATA.map((orb, i) => {
          const phase = (i * Math.PI * 2) / 3;
          return {
            x: 60 + Math.sin(t * 0.7 + phase) * 20,
            y: orb.baseY + Math.cos(t * 0.5 + phase) * 5,
          };
        })
      );

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Determine orb states based on scroll
  // 0-30%: quiet ambient (small, low opacity)
  // 30-50%: growing, migrating inward (color extraction section)
  // 50-65%: crisis — Silmarillion morphs green→blue
  // 65-100%: settled, calm
  const getOrbStyle = (index: number) => {
    const pos = orbPositions[index];
    let size: number;
    let opacity: number;
    let color = ORBS_DATA[index].color;
    let scale = 1;

    if (scrollProgress < 0.3) {
      // Quiet phase
      size = 14;
      opacity = 0.2;
      scale = 1 + Math.sin(Date.now() * 0.001 + index) * 0.02;
    } else if (scrollProgress < 0.5) {
      // Growing phase
      const t = (scrollProgress - 0.3) / 0.2;
      size = 14 + t * 18;
      opacity = 0.2 + t * 0.5;
    } else if (scrollProgress < 0.65) {
      // Crisis phase
      const t = (scrollProgress - 0.5) / 0.15;
      size = 32;
      opacity = 0.7;
      if (index === 2) {
        // Silmarillion morphs from green to blue
        color = lerpColor(ORBS_DATA[2].color, SILMARILLION_BLUE, t);
      }
    } else {
      // Settled phase
      size = 24;
      opacity = 0.5;
      if (index === 2) color = SILMARILLION_BLUE;
    }

    return {
      width: size,
      height: size,
      opacity,
      backgroundColor: color,
      transform: `translate(${pos.x}px, ${pos.y}vh) scale(${scale})`,
      boxShadow: `0 0 ${size}px ${color}40`,
    };
  };

  return (
    <div ref={containerRef} className="orbs-container">
      {ORBS_DATA.map((orb, i) => (
        <div key={i} className="orb" style={getOrbStyle(i)}>
          <span className="orb-tooltip">
            {i === 2 && scrollProgress > 0.6
              ? `The Silmarillion · ${SILMARILLION_BLUE}`
              : orb.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function lerpColor(a: string, b: string, t: number): string {
  const parseHex = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  });
  const ca = parseHex(a);
  const cb = parseHex(b);
  const r = Math.round(ca.r + (cb.r - ca.r) * t);
  const g = Math.round(ca.g + (cb.g - ca.g) * t);
  const bl = Math.round(ca.b + (cb.b - ca.b) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}
