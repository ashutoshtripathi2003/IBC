import type { ReactNode } from 'react';
import { Icon } from './Icon';
import styles from './Badge.module.css';

/** Verified is shown only for genuinely verified records; demo marks demonstration data. */
export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'verified' | 'demo' | 'neutral' | 'gold';
  children: ReactNode;
}) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      {tone === 'verified' && <Icon name="shield" size={14} />}
      {children}
    </span>
  );
}

export function DemoBadge() {
  return (
    <span
      className={`${styles.badge} ${styles.demo}`}
      title="Demonstration listing: fictional data shown before members join"
    >
      Demo
    </span>
  );
}

/** A descriptive chip (capability, segment, location). */
export function Tag({ children }: { children: ReactNode }) {
  return <span className={styles.tag}>{children}</span>;
}
