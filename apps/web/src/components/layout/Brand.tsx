/* eslint-disable @next/next/no-img-element -- static brand asset with explicit size; no optimisation needed */
import styles from './Brand.module.css';

/** IBC brand mark with the company name. `tone="light"` is for dark navy backgrounds. */
export function Brand({
  tone = 'dark',
  showName = true,
}: {
  tone?: 'dark' | 'light';
  showName?: boolean;
}) {
  const src = tone === 'light' ? '/brand/ibc-mark-light' : '/brand/ibc-mark';
  return (
    <span className={`${styles.brand} ${tone === 'light' ? styles.light : ''}`}>
      <img
        src={`${src}.png`}
        srcSet={`${src}.png 1x, ${src}@2x.png 2x`}
        width={84}
        height={40}
        alt=""
      />
      {showName && (
        <span className={styles.name}>
          Industrial
          <br />
          Business Circle
        </span>
      )}
    </span>
  );
}
