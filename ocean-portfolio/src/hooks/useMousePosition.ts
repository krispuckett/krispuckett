'use client';

import { useState, useEffect, useCallback } from 'react';

interface MousePosition {
  x: number;
  y: number;
  normalizedX: number; // 0 to 1
  normalizedY: number; // 0 to 1
}

export function useMousePosition(): MousePosition {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
    normalizedX: 0.5,
    normalizedY: 0.5,
  });

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const x = event.clientX;
    const y = event.clientY;
    const normalizedX = x / window.innerWidth;
    const normalizedY = 1 - y / window.innerHeight; // Invert Y for shader

    setMousePosition({
      x,
      y,
      normalizedX,
      normalizedY,
    });
  }, []);

  useEffect(() => {
    // Set initial position to center
    setMousePosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      normalizedX: 0.5,
      normalizedY: 0.5,
    });

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return mousePosition;
}
