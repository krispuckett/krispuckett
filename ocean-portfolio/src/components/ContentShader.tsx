'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    UnicornStudio?: {
      init: () => Promise<unknown[]>;
      destroy: () => void;
      addScene: (options: { elementId: string; projectId: string; scale?: number; lazyLoad?: boolean }) => Promise<unknown>;
    };
  }
}

export default function ContentShader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const containerId = 'unicorn-shader-container';
    containerRef.current.id = containerId;

    const initScene = async () => {
      // Load script if not loaded
      if (!window.UnicornStudio) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.5.2/dist/unicornStudio.umd.js';
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Add scene to this specific element
      if (window.UnicornStudio && containerRef.current) {
        try {
          sceneRef.current = await window.UnicornStudio.addScene({
            elementId: containerId,
            projectId: 'RqEDx7QuumPGjylmDNRq',
            scale: 1,
            lazyLoad: false,
          });
        } catch (e) {
          console.error('Unicorn Studio error:', e);
        }
      }
    };

    initScene();

    return () => {
      // Cleanup handled by Unicorn Studio
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
