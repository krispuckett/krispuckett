'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    UnicornStudio?: {
      isInitialized: boolean;
      init: () => void;
      destroy: () => void;
    };
  }
}

export default function ContentShader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initialized.current) return;

    // Load Unicorn Studio script
    const loadUnicornStudio = () => {
      if (!window.UnicornStudio) {
        window.UnicornStudio = {
          isInitialized: false,
          init: () => {},
          destroy: () => {},
        };

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.5.2/dist/unicornStudio.umd.js';
        script.onload = () => {
          if (window.UnicornStudio && !window.UnicornStudio.isInitialized) {
            window.UnicornStudio.init();
            window.UnicornStudio.isInitialized = true;
          }
        };
        document.head.appendChild(script);
      } else if (!window.UnicornStudio.isInitialized) {
        window.UnicornStudio.init();
        window.UnicornStudio.isInitialized = true;
      }
    };

    loadUnicornStudio();
    initialized.current = true;

    return () => {
      // Cleanup if needed
      if (window.UnicornStudio?.destroy) {
        // window.UnicornStudio.destroy();
      }
    };
  }, []);

  return (
    <div className="w-full h-full">
      <div
        ref={containerRef}
        data-us-project="RqEDx7QuumPGjylmDNRq"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
