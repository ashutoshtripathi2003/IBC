'use client';

import { useSyncExternalStore } from 'react';

function useMediaQuery(query: string, serverValue: boolean): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => {
        list.removeEventListener('change', onChange);
      };
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** True on devices with a precise pointer that can hover (desktop mice and trackpads). */
export function useFinePointer(): boolean {
  return useMediaQuery('(hover: hover) and (pointer: fine)', false);
}

/** Reads `prefers-reduced-motion`, updating if the user changes it. Reduced on the server. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)', true);
}

/** True when the viewport is at least `px` wide. */
export function useMinWidth(px: number): boolean {
  return useMediaQuery(`(min-width: ${px}px)`, false);
}

/** True once the page has scrolled past `threshold` pixels. */
export function useScrolledPast(threshold: number): boolean {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener('scroll', onChange, { passive: true });
      return () => {
        window.removeEventListener('scroll', onChange);
      };
    },
    () => window.scrollY > threshold,
    () => false,
  );
}
