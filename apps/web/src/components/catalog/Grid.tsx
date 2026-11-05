import type { ReactNode } from 'react';
import styles from './Grid.module.css';

/**
 * Responsive card grid: columns follow available width; every child shrinks safely.
 * `compact` keeps two columns on phones (for small tiles such as industries).
 */
export function Grid({
  children,
  min = 17,
  compact = false,
}: {
  children: ReactNode;
  min?: number;
  compact?: boolean;
}) {
  return (
    <div
      className={`${styles.grid} ${compact ? styles.compact : ''}`}
      style={{ ['--min' as string]: `${min}rem` }}
    >
      {children}
    </div>
  );
}
