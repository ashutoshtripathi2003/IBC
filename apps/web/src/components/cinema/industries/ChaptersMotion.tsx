'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, ScrollTrigger } from '@/lib/motion/gsap';
import { useScene } from '@/lib/motion/useScene';

/**
 * Desktop: the section pins and the chapters travel horizontally as the visitor scrolls
 * down (vertical scrolling is never taken over; it is translated). Each plate turns and
 * settles as its chapter arrives. Phones and reduced motion get a vertical sequence.
 */
export function ChaptersMotion({
  className,
  trackClass,
  stageClass,
  children,
}: {
  className?: string | undefined;
  trackClass?: string | undefined;
  stageClass?: string | undefined;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useScene(
    ref,
    ({ full, compact }, root) => {
      const q = gsap.utils.selector(root);
      if (full) {
        const track = q('[data-track]')[0];
        if (!track) return;
        root.dataset.motion = 'horizontal';
        // A sticky stage (no JS pinning, so no layout shift): the section is as tall as the
        // horizontal distance, and vertical progress through it moves the track sideways.
        const distance = () => track.scrollWidth - window.innerWidth;
        const size = () => {
          root.style.height = `${distance() + window.innerHeight}px`;
        };
        size();
        ScrollTrigger.addEventListener('refreshInit', size);
        const travel = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
        for (const panel of q('article')) {
          const ring = panel.querySelector('[data-plate-ring]');
          const mark = panel.querySelector('[data-plate-mark]');
          const text = panel.querySelectorAll('h3, ul, p, a');
          const trigger = {
            trigger: panel,
            containerAnimation: travel,
            start: 'left right',
            end: 'center center',
            scrub: true,
          };
          if (ring)
            gsap.fromTo(
              ring,
              { rotate: -50, transformOrigin: '300px 300px' },
              { rotate: 0, ease: 'none', scrollTrigger: trigger },
            );
          if (mark)
            gsap.fromTo(
              mark,
              { opacity: 0.15 },
              { opacity: 1, ease: 'none', scrollTrigger: trigger },
            );
          if (text.length)
            gsap.from(text, {
              x: 80,
              opacity: 0,
              stagger: 0.04,
              ease: 'none',
              scrollTrigger: trigger,
            });
        }
        return () => {
          ScrollTrigger.removeEventListener('refreshInit', size);
          root.style.height = '';
          delete root.dataset.motion;
        };
      }
      if (compact) {
        for (const panel of q('article')) {
          gsap.from(panel.querySelectorAll('h2, h3, ul, p, a, svg'), {
            y: 40,
            opacity: 0,
            duration: 0.9,
            ease: 'expo.out',
            stagger: 0.06,
            scrollTrigger: { trigger: panel, start: 'top 80%' },
          });
        }
      }
    },
    // Eager: this scene changes the page height (horizontal travel), so it must be in place
    // before anything below it is measured or reached by an anchor link.
    { eager: true },
  );

  return (
    <section
      ref={ref}
      id="industries"
      className={className}
      aria-labelledby="industries-title"
      data-tone="dark"
    >
      <div className={stageClass}>
        <div className={trackClass} data-track>
          {children}
        </div>
      </div>
    </section>
  );
}
