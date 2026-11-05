'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { track } from '@/lib/analytics';
import { gsap } from '@/lib/motion/gsap';
import { useScene } from '@/lib/motion/useScene';

const DEPTH: Record<string, { scroll: number; pointer: number }> = {
  sky: { scroll: 4, pointer: 2 },
  sun: { scroll: 8, pointer: 4 },
  far: { scroll: 6, pointer: 6 },
  mid: { scroll: 12, pointer: 12 },
  near: { scroll: 22, pointer: 22 },
};

/**
 * Scroll and pointer depth for the hero: as the visitor scrolls, the camera "dollies"
 * through the layers (near moves fastest) and the headline lifts away; a fine pointer adds
 * a few pixels of parallax. Nothing here is needed to read the scene.
 */
export function HeroMotion({
  className,
  children,
}: {
  className?: string | undefined;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  // Calls to action are plain links in server markup; measure them here.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest('a[data-cta]');
      if (link instanceof HTMLAnchorElement && link.dataset.cta === 'join') {
        track({ name: 'join_click', location: 'hero' });
      } else if (link instanceof HTMLAnchorElement) {
        track({ name: 'cta_click', cta: link.dataset.cta ?? 'unknown', location: 'hero' });
      }
    };
    root.addEventListener('click', onClick);
    return () => {
      root.removeEventListener('click', onClick);
    };
  }, []);
  useScene(ref, ({ full, compact }, root) => {
    if (!full && !compact) return;
    const q = gsap.utils.selector(root);
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
    });
    for (const [name, depth] of Object.entries(DEPTH)) {
      tl.to(q(`[data-depth="${name}"]`), { yPercent: -depth.scroll * (compact ? 0.6 : 1) }, 0);
    }
    tl.to(q('svg'), { scale: 1.08, transformOrigin: '50% 100%' }, 0);
    tl.to(q('[data-depth="content"]'), { y: -140, autoAlpha: 0 }, 0);

    if (full && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const movers = Object.entries(DEPTH).map(([name, depth]) => ({
        x: gsap.quickTo(q(`[data-depth="${name}"]`), 'x', { duration: 1.2, ease: 'power3' }),
        depth: depth.pointer,
      }));
      const onMove = (event: PointerEvent) => {
        const nx = event.clientX / window.innerWidth - 0.5;
        for (const m of movers) m.x(-nx * m.depth);
      };
      root.addEventListener('pointermove', onMove);
      return () => {
        root.removeEventListener('pointermove', onMove);
      };
    }
  });
  return (
    <section ref={ref} className={className} aria-labelledby="hero-title" data-tone="dark">
      {children}
    </section>
  );
}
