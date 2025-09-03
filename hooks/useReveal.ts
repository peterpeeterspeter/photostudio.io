'use client';
import { useEffect, useRef, useState } from 'react';

export function useReveal<T extends HTMLElement>(opts: IntersectionObserverInit = { root: null, threshold: 0.15 }) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, opts);
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [opts]);
  return { ref, visible };
}