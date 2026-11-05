'use client';

import Lenis from 'lenis';
import { useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/lib/motion/gsap';

/**
 * Gentle inertial scrolling for mouse and trackpad users on wide screens. It never takes
 * over touch scrolling, keyboard scrolling or reduced motion, and it drives ScrollTrigger
 * from the same clock so pinned scenes stay in sync.
 */
export function SmoothScroll() {
  useEffect(() => {
    const allowed = window.matchMedia(
      '(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)',
    );
    let lenis: Lenis | null = null;
    const tick = (time: number) => {
      lenis?.raf(time * 1000);
    };
    const start = () => {
      if (lenis || !allowed.matches) return;
      lenis = new Lenis({ duration: 1.05, anchors: true, autoRaf: false });
      lenis.on('scroll', () => {
        ScrollTrigger.update();
      });
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    };
    const stop = () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
    const onChange = () => {
      if (allowed.matches) start();
      else stop();
    };
    start();
    allowed.addEventListener('change', onChange);
    return () => {
      allowed.removeEventListener('change', onChange);
      stop();
    };
  }, []);
  return null;
}
