'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, ScrollTrigger } from '@/lib/motion/gsap';
import { useScene } from '@/lib/motion/useScene';

/**
 * Shared choreography for the story scenes, driven by data attributes in server markup:
 * - `data-line`: masked headline line (its first child rises into view);
 * - `data-rise`: fades and rises in, staggered within its scene;
 * - `data-speed="0.2"`: parallax depth while the scene crosses the screen;
 * - `data-draw` / `data-draw-y`: connector drawn by scroll (horizontal / vertical);
 * - `data-step`: steps activated in order through the scene (`data-active` is set).
 * Without JavaScript, or with reduced motion, everything is simply shown.
 */
export function SceneMotion({
  id,
  className,
  labelledBy,
  tone,
  children,
}: {
  id?: string;
  className?: string | undefined;
  labelledBy?: string;
  tone?: 'dark' | 'light';
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useScene(ref, ({ full, compact }, root) => {
    if (!full && !compact) return;
    const q = gsap.utils.selector(root);
    const lines = q('[data-line] > *');
    if (lines.length) {
      gsap.from(lines, {
        yPercent: 108,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: { trigger: lines[0]!.parentElement!, start: 'top 85%' },
      });
    }
    ScrollTrigger.batch(q('[data-rise]'), {
      start: 'top 88%',
      onEnter: (batch) =>
        gsap.from(batch, { y: 36, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07 }),
      once: true,
    });
    if (full) {
      for (const el of q('[data-speed]')) {
        const speed = Number(el.dataset.speed ?? 0);
        gsap.fromTo(
          el,
          { yPercent: speed * 40 },
          {
            yPercent: -speed * 40,
            ease: 'none',
            scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      }
    }
    const steps = q('[data-step]');
    const stepRoot = q('[data-steps]')[0] ?? root;
    if (steps.length) {
      root.dataset.motion = 'on';
      ScrollTrigger.create({
        trigger: stepRoot,
        start: 'top 65%',
        end: 'bottom 55%',
        onUpdate: (self) => {
          const active = Math.floor(self.progress * steps.length * 0.999);
          steps.forEach((el, i) => {
            el.toggleAttribute('data-active', i <= active);
          });
        },
        onLeaveBack: () => {
          steps.forEach((el) => {
            el.removeAttribute('data-active');
          });
        },
      });
    }
    for (const el of q('[data-draw]')) {
      gsap.fromTo(
        el,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          transformOrigin: 'left center',
          scrollTrigger: { trigger: stepRoot, start: 'top 65%', end: 'bottom 55%', scrub: true },
        },
      );
    }
    for (const el of q('[data-draw-y]')) {
      gsap.fromTo(
        el,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          transformOrigin: 'center top',
          scrollTrigger: { trigger: stepRoot, start: 'top 65%', end: 'bottom 55%', scrub: true },
        },
      );
    }
    return () => {
      delete root.dataset.motion;
    };
  });
  return (
    <section ref={ref} id={id} className={className} aria-labelledby={labelledBy} data-tone={tone}>
      {children}
    </section>
  );
}
