import Link from 'next/link';
import { MarketplaceShowcase } from './MarketplaceShowcase';
import { SceneMotion } from './SceneMotion';
import styles from './Scenes.module.css';

/** Scene 06 — the IBC marketplace. */
export function MarketplaceScene() {
  return (
    <SceneMotion
      id="marketplace"
      className={`${styles.scene} ${styles.white}`}
      labelledBy="marketplace-title"
      tone="light"
    >
      <div className={styles.container}>
        <div className={styles.headRow}>
          <div>
            <p className={`eyebrow ${styles.eyebrowDark}`}>The IBC marketplace</p>
            <h2 id="marketplace-title" className={`display ${styles.titleDark} ${styles.wide}`}>
              <span className="mask-line" data-line>
                <span>Products with</span>
              </span>
              <span className="mask-line" data-line>
                <span className={styles.goldText}>the details that matter.</span>
              </span>
            </h2>
          </div>
          <p className={styles.lead} data-rise>
            Specifications, minimum order, origin and price, or price on request, with the supplier
            one click away.
          </p>
        </div>
        <div data-rise>
          <MarketplaceShowcase />
        </div>
        <div className={styles.centerRow} data-rise>
          <Link href="/products" className={styles.btnDark}>
            Open the marketplace
          </Link>
        </div>
      </div>
    </SceneMotion>
  );
}
