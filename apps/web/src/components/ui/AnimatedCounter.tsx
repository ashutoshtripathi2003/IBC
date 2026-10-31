'use client';

import { animate, useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/motion/hooks';

/**
 * Counts up to `value` the first time it scrolls into view. The final value is rendered
 * on the server, so screen readers, crawlers and reduced-motion users always get the number.
 */
export function AnimatedCounter({ value, locale = 'en' }: { value: number; locale?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(value);
  const format = new Intl.NumberFormat(locale);

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplay(Math.round(latest));
      },
    });
    return () => {
      controls.stop();
    };
  }, [inView, reduced, value]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>
      <span className="visually-hidden">{format.format(value)}</span>
      <span aria-hidden="true">{format.format(display)}</span>
    </span>
  );
}
