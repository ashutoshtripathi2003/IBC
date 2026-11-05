import styles from './LoadingState.module.css';

/** Skeleton placeholders for results that take longer than a moment. */
export function ResultSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-live="polite" className={styles.wrap}>
      <span className="visually-hidden">Loading results</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.row} aria-hidden="true">
          <span className={styles.block} />
          <span className={styles.lines}>
            <span className={styles.line} />
            <span className={`${styles.line} ${styles.short}`} />
          </span>
        </div>
      ))}
    </div>
  );
}
