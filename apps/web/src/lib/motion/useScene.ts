'use client';

import { useLayoutEffect, useEffect, type RefObject } from 'react';
import { gsap, MOTION_QUERIES, ScrollTrigger } from './gsap';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

type Conditions = { full: boolean; compact: boolean; reduced: boolean };

/**
 * Runs a scene's GSAP setup scoped to `ref`, once per motion condition (desktop, phone,
 * reduced motion). Everything created inside (tweens, timelines, ScrollTriggers) is
 * reverted on unmount or when the condition changes, so scenes never leak listeners or
 * leave inline styles behind.
 *
 * Scenes below the fold are set up lazily, when they come within a screen of the
 * viewport, so the first load does not pay for the whole story at once.
 */
export function useScene(
  ref: RefObject<HTMLElement | null>,
  setup: (conditions: Conditions, root: HTMLElement) => (() => void) | undefined,
  { eager = false }: { eager?: boolean } = {},
) {
  useIsoLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    let mm: gsap.MatchMedia | null = null;
    const start = (refresh: boolean) => {
      if (mm) return;
      mm = gsap.matchMedia(root);
      mm.add(MOTION_QUERIES, (context) => setup(context.conditions as Conditions, root));
      // Positions of scenes further down depend on this one's final size.
      if (refresh) ScrollTrigger.refresh();
    };
    let observer: IntersectionObserver | null = null;
    if (eager || root.getBoundingClientRect().top < window.innerHeight * 2) {
      start(false);
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          observer?.disconnect();
          start(true);
        },
        { rootMargin: '100% 0px' },
      );
      observer.observe(root);
    }
    return () => {
      observer?.disconnect();
      mm?.revert();
    };
    // The setup is defined inline by each scene and runs once per mount.
  }, []);
}
