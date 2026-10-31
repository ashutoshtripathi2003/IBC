import type { ReactNode } from 'react';
import styles from './Badge.module.css';

/** Status marker. `verified` is reserved for real verification and always uses the trust colour. */
export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'verified' | 'neutral' | 'action';
  children: ReactNode;
}) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      {tone === 'verified' && (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path
            d="M8 1.5l1.6 1.2 2-.1.6 1.9 1.6 1.2-.6 1.9.6 1.9-1.6 1.2-.6 1.9-2-.1L8 14.5l-1.6-1.2-2 .1-.6-1.9-1.6-1.2.6-1.9-.6-1.9 1.6-1.2.6-1.9 2 .1z"
            fill="currentColor"
            opacity=".25"
          />
          <path
            d="M5.2 8.2l1.9 1.9 3.8-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {children}
    </span>
  );
}

/** A descriptive chip (industry, capability, location). */
export function Tag({ children }: { children: ReactNode }) {
  return <span className={styles.tag}>{children}</span>;
}
