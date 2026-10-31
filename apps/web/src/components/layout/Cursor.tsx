'use client';

import { motion, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useState } from 'react';
import { useFinePointer, usePrefersReducedMotion } from '@/lib/motion/hooks';
import styles from './Cursor.module.css';

/**
 * A soft ring that trails the system cursor on desktop and opens up over interactive
 * elements and network nodes. The native cursor is never hidden. Disabled on touch
 * devices and when motion is reduced.
 */
export function Cursor() {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const enabled = fine && !reduced;
  const x = useSpring(useMotionValue(-100), { stiffness: 500, damping: 40, mass: 0.4 });
  const y = useSpring(useMotionValue(-100), { stiffness: 500, damping: 40, mass: 0.4 });
  const [mode, setMode] = useState<'idle' | 'action' | 'node'>('idle');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
      const target = event.target as Element | null;
      const action = target?.closest('a, button, [data-cursor="action"], input, select, textarea');
      const overNode = document.documentElement.dataset.cursorNode === 'true';
      setMode(action ? 'action' : overNode ? 'node' : 'idle');
    };
    const onLeave = () => {
      setVisible(false);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;
  return (
    <motion.div
      aria-hidden="true"
      className={`${styles.ring} ${styles[mode]} ${visible ? styles.visible : ''}`}
      style={{ x, y }}
    />
  );
}
