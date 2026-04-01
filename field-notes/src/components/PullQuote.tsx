"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function PullQuote({ children }: { children: ReactNode }) {
  const lineRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!lineRef.current) return;
    const parent = lineRef.current.parentElement;
    if (!parent) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          lineRef.current?.classList.add("visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  return (
    <blockquote className="pull-quote">
      {children}
      <span ref={lineRef} className="pull-quote-line" />
    </blockquote>
  );
}
