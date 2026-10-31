'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { easeOut } from '@/lib/motion';
import { usePrefersReducedMotion } from '@/lib/motion/hooks';

/** Page transition: each route settles into place, keeping navigation feeling continuous. */
export default function Template({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}
