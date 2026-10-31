import styles from './LoadingState.module.css';

/** Three knots joined by a thread that draws itself: the network's own loading mark. */
export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className={styles.wrap} role="status">
      <svg viewBox="0 0 64 24" width="64" height="24" aria-hidden="true" className={styles.mark}>
        <path className={styles.thread} d="M6 16 Q19 2 32 12 T58 8" fill="none" />
        <circle cx="6" cy="16" r="3" className={styles.knot} />
        <circle cx="32" cy="12" r="3" className={styles.knot} />
        <circle cx="58" cy="8" r="3" className={styles.knot} />
      </svg>
      <span className="visually-hidden">{label}</span>
    </div>
  );
}
