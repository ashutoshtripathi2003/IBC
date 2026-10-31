import type { ReactNode } from 'react';
import styles from './layout.module.css';

/**
 * A chapter of the page. `align` decides which side the text sits on so the network
 * stage can occupy the other side on wide screens.
 */
export function Section({
  id,
  children,
  labelledBy,
  align = 'start',
  fullHeight = true,
  className,
}: {
  id?: string;
  children: ReactNode;
  labelledBy?: string;
  align?: 'start' | 'end' | 'wide';
  fullHeight?: boolean;
  className?: string | undefined;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={[styles.section, styles[align], fullHeight ? styles.full : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </section>
  );
}
