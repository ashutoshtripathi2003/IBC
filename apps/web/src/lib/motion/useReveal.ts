'use client';

import { useInView } from 'motion/react';
import type { RefObject } from 'react';
import { usePrefersReducedMotion } from './hooks';

/**
 * Variant for scroll-triggered reveals: 'shown' when motion is reduced or the element has
 * entered the viewport, otherwise 'hidden'. Content is visible in server HTML (reduced is
 * assumed until hydration), and is only hidden afterwards while it is still off-screen.
 */
export function useReveal(ref: RefObject<Element | null>, amount = 0.4): 'shown' | 'hidden' {
  const reduced = usePrefersReducedMotion();
  const inView = useInView(ref, { once: true, amount });
  return reduced || inView ? 'shown' : 'hidden';
}

/** Instant hide, eased show: hiding happens off-screen and must not be seen. */
export const instantHide = { duration: 0 } as const;
