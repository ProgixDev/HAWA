'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * True while `ref`'s element intersects the viewport (plus `margin`).
 * Backed by a single IntersectionObserver, so it costs nothing per scroll frame.
 * Used to stop autoplay timers and decorative loops for sections that are off-screen.
 */
export function useInViewport<T extends Element>(
  ref: RefObject<T | null>,
  margin = '0px'
): boolean {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: margin,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, margin]);

  return inView;
}
