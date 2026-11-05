'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Registered once, in the browser only.
if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

/** Media conditions shared by every scene (see docs/DESIGN.md → Motion). */
export const MOTION_QUERIES = {
  full: '(prefers-reduced-motion: no-preference) and (min-width: 900px)',
  compact: '(prefers-reduced-motion: no-preference) and (max-width: 899px)',
  reduced: '(prefers-reduced-motion: reduce)',
} as const;
