import Link from 'next/link';
import { site } from '@/content/site';
import { SceneMotion } from './SceneMotion';
import styles from './Scenes.module.css';

/** Scene 08 — "The future of business is connected." */
export function FinaleScene() {
  return (
    <SceneMotion
      id="join"
      className={`${styles.scene} ${styles.finale}`}
      labelledBy="finale-title"
      tone="dark"
    >
      <div className={styles.horizon} aria-hidden="true" />
      <div className={styles.finaleInner}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
        <img
          src="/brand/ibc-mark-light@2x.png"
          alt=""
          width={202}
          height={96}
          className={styles.finaleMark}
          data-rise
        />
        <h2 id="finale-title" className={`display ${styles.finaleTitle}`}>
          <span className="mask-line" data-line>
            <span>The future of business</span>
          </span>
          <span className="mask-line" data-line>
            <span className={styles.goldText}>is connected.</span>
          </span>
        </h2>
        <p className={styles.finaleBrand} data-rise>
          Industrial Business Circle
        </p>
        <p className={styles.finaleTagline} data-rise>
          {site.motto}
        </p>
        <div className={styles.finaleCtas} data-rise>
          <Link href="/discover" className={styles.btnGold}>
            Explore IBC
          </Link>
          <Link href="/join" className={styles.btnOutlineLight}>
            Join IBC
          </Link>
          <Link href="/businesses" className={styles.btnOutlineLight}>
            Discover businesses
          </Link>
        </div>
      </div>
    </SceneMotion>
  );
}
