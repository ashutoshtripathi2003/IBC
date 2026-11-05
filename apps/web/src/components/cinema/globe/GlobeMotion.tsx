'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { gsap, ScrollTrigger } from '@/lib/motion/gsap';
import { useScene } from '@/lib/motion/useScene';
import type { Globe } from './engine';

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Drives the globe from scroll: the section is a tall track with a sticky stage; progress
 * through it rotates the globe, draws routes and advances the captions. Three.js is loaded
 * only when the scene is about to be seen, and paused whenever it is off-screen.
 */
export function GlobeMotion({
  className,
  stageClass,
  children,
}: {
  className?: string | undefined;
  stageClass?: string | undefined;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const globe = useRef<Globe | null>(null);
  const progress = useRef(0);

  // Lazy-load and own the WebGL globe.
  useEffect(() => {
    const root = ref.current;
    const canvas = root?.querySelector('canvas');
    if (!root || !canvas || !webglAvailable()) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lite =
      window.matchMedia('(max-width: 899px)').matches || (navigator.hardwareConcurrency || 8) <= 4;
    let disposed = false;
    let visibility: IntersectionObserver | null = null;
    const onResize = () => globe.current?.resize();

    const loader = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        loader.disconnect();
        // Safari has no requestIdleCallback.
        const idle = (cb: () => void) => {
          const ric = (window as { requestIdleCallback?: (fn: () => void) => number })
            .requestIdleCallback;
          if (ric) ric.call(window, cb);
          else window.setTimeout(cb, 200);
        };
        idle(() => {
          void import('./engine')
            .then(({ createGlobe }) =>
              createGlobe(canvas, {
                lite,
                still,
                dotsUrl: lite ? '/globe/land-dots-lite.bin' : '/globe/land-dots.bin',
              }),
            )
            .then((instance) => {
              if (disposed) {
                instance.dispose();
                return;
              }
              globe.current = instance;
              instance.setProgress(still ? 0.55 : progress.current);
              root.dataset.globe = 'ready';
              visibility = new IntersectionObserver((list) => {
                instance.setActive(list.some((e) => e.isIntersecting) && !document.hidden);
              });
              visibility.observe(root);
              window.addEventListener('resize', onResize);
            })
            .catch(() => {
              // The SVG poster stays in place.
            });
        });
      },
      { rootMargin: '0px' },
    );
    loader.observe(root);
    const onVisibility = () => globe.current?.setActive(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      disposed = true;
      loader.disconnect();
      visibility?.disconnect();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      globe.current?.dispose();
      globe.current = null;
    };
  }, []);

  useScene(ref, ({ full, compact }, root) => {
    if (!full && !compact) return;
    root.dataset.motion = 'on';
    const q = gsap.utils.selector(root);
    const steps = q('[data-step]');
    let current = -1;
    const show = (index: number) => {
      if (index === current) return;
      current = index;
      steps.forEach((el, i) => {
        el.toggleAttribute('data-active', i === index);
      });
    };
    show(0);
    gsap.from(q('[data-reveal] > span'), {
      yPercent: 105,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.12,
      scrollTrigger: { trigger: root, start: 'top 70%' },
    });
    ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        progress.current = self.progress;
        globe.current?.setProgress(self.progress);
        show(Math.min(steps.length - 1, Math.floor(self.progress * steps.length * 0.999)));
      },
    });
    return () => {
      delete root.dataset.motion;
    };
  });

  return (
    <section
      ref={ref}
      id="connections"
      className={className}
      aria-labelledby="connections-title"
      data-tone="dark"
    >
      <div className={stageClass}>{children}</div>
    </section>
  );
}
