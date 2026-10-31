import type { CSSProperties } from 'react';
import styles from './RevealText.module.css';

/**
 * Reveals a headline word by word from beneath a mask. Pure CSS, so it starts at first
 * paint (independent of JavaScript hydration), is disabled by prefers-reduced-motion, and
 * always ends fully visible. The full text is in the DOM for SEO and screen readers.
 */
export function RevealText({ text }: { text: string }) {
  const words = text.split(' ');
  return (
    <span className={styles.root}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className={styles.mask}>
          <span className={styles.word} style={{ '--i': index } as CSSProperties}>
            {word}
          </span>
          {index < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  );
}
