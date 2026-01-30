/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useEffect, useRef, useState } from 'react';

export interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
}

/**
 * Lightweight IntersectionObserver hook for scroll-triggered animations.
 * Returns isInView when the element enters the viewport (plus rootMargin).
 */
export function useInView(options: UseInViewOptions = {}): {
  isInView: boolean;
  ref: React.RefObject<HTMLDivElement>;
} {
  const { threshold = 0.1, rootMargin = '0px 0px -50px 0px' } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { isInView, ref };
}
