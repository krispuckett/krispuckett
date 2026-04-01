"use client";

import { useEffect, useRef, useState } from "react";

interface Line {
  role: "human" | "ai";
  text: string;
}

interface TerminalProps {
  lines: Line[];
}

export default function Terminal({ lines }: TerminalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);
  const [visibleChars, setVisibleChars] = useState<number[]>([]);
  const [activeLine, setActiveLine] = useState(0);
  const [done, setDone] = useState(false);

  // Trigger on scroll into view
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered) {
          setTriggered(true);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [triggered]);

  // Check reduced motion preference
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDone(true);
    }
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (!triggered || done) return;
    if (activeLine >= lines.length) {
      setDone(true);
      return;
    }

    const text = lines[activeLine].text;
    let charIndex = 0;

    setVisibleChars((prev) => {
      const next = [...prev];
      next[activeLine] = 0;
      return next;
    });

    const interval = setInterval(() => {
      charIndex++;
      setVisibleChars((prev) => {
        const next = [...prev];
        next[activeLine] = charIndex;
        return next;
      });
      if (charIndex >= text.length) {
        clearInterval(interval);
        // Pause between lines
        setTimeout(() => setActiveLine((a) => a + 1), 300);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [triggered, activeLine, done, lines]);

  return (
    <div ref={ref} className="terminal">
      {lines.map((line, i) => {
        const showFull = done || i < activeLine;
        const isTyping = triggered && !done && i === activeLine;
        const chars = visibleChars[i] ?? 0;
        const hidden = !done && !showFull && !isTyping;

        if (hidden) return null;

        return (
          <div
            key={i}
            className={`terminal-line ${
              line.role === "human" ? "terminal-human" : "terminal-ai"
            }`}
          >
            {showFull ? line.text : line.text.slice(0, chars)}
            {isTyping && !showFull && <span className="terminal-cursor" />}
          </div>
        );
      })}
    </div>
  );
}
