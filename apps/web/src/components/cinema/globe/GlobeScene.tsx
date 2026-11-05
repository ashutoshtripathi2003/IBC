import { GlobeMotion } from './GlobeMotion';
import { GlobePoster } from './GlobePoster';
import styles from './Globe.module.css';

const STEPS = [
  { kicker: 'Manufacture', text: 'A precision foundry in Pune.' },
  { kicker: 'Source', text: 'A buyer in Rotterdam looking for castings.' },
  { kicker: 'Supply', text: 'A raw-material supplier in Singapore.' },
  { kicker: 'Connect', text: 'One circle where they find each other.' },
] as const;

/** Scene 02 — "One world. Infinite connections." */
export function GlobeScene() {
  return (
    <GlobeMotion className={styles.scene} stageClass={styles.stage}>
      <div className={styles.visual}>
        <GlobePoster className={styles.poster} />
        <canvas className={styles.canvas} aria-hidden="true" />
      </div>
      <div className={styles.copy}>
        <p className={`eyebrow ${styles.eyebrow}`}>A connected industrial world</p>
        <h2 id="connections-title" className={`display ${styles.title}`}>
          <span className="mask-line" data-reveal>
            <span>One world.</span>
          </span>
          <span className="mask-line" data-reveal>
            <span className={styles.gold}>Infinite connections.</span>
          </span>
        </h2>
        <ol className={styles.steps}>
          {STEPS.map((step, i) => (
            <li key={step.kicker} className={styles.step} data-step={i}>
              <span className={styles.stepNum}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.kicker}>{step.kicker}</span>
              <span className={styles.stepText}>{step.text}</span>
            </li>
          ))}
        </ol>
        <p className={styles.note}>Routes are illustrative.</p>
      </div>
    </GlobeMotion>
  );
}
