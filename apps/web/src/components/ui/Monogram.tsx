import styles from './Monogram.module.css';

/**
 * Company logo placeholder and person avatar: initials on a tone derived from the name,
 * so the same entity always looks the same. Real logos and photos replace it later.
 */
const TONES = ['#10243e', '#22446e', '#2f5d62', '#5a4632', '#3c3f6b', '#4a5a3a'];

function tone(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length]!;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

export function Monogram({
  name,
  size = 48,
  shape = 'square',
}: {
  name: string;
  size?: number;
  shape?: 'square' | 'circle';
}) {
  return (
    <span
      className={`${styles.monogram} ${shape === 'circle' ? styles.circle : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.36, background: tone(name) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
