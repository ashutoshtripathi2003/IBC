import styles from './Logo.module.css';

/**
 * The IBC mark: three knots (person, business, product) tied by one continuous thread.
 * `animated` draws the thread in and is used by the opening sequence.
 */
export function LogoMark({ size = 28, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      className={animated ? styles.animated : undefined}
    >
      <path
        className={styles.thread}
        d="M7 22 C 9 10, 23 6, 25 12 S 15 28, 7 22 Z"
        fill="none"
        stroke="var(--periwinkle)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle className={styles.knot} cx="7" cy="22" r="3.2" fill="var(--periwinkle)" />
      <circle className={styles.knot} cx="25" cy="12" r="3.2" fill="var(--chalk)" />
      <circle className={styles.knot} cx="16.4" cy="11" r="3.2" fill="var(--marigold)" />
    </svg>
  );
}

export function Logo({ withName = false }: { withName?: boolean }) {
  return (
    <span className={styles.logo}>
      <LogoMark />
      <span className={styles.word}>IBC</span>
      {withName && <span className={styles.name}>Indian Business Circle</span>}
    </span>
  );
}
