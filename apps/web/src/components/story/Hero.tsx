import { Button } from '@/components/ui/Button';
import { RevealText } from '@/components/ui/RevealText';
import { accountLinks, site } from '@/content/site';
import { NetworkLegend } from './NetworkLegend';
import styles from './Hero.module.css';

/** Opening viewport. The entrance is CSS-driven so it starts at first paint. */
export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.copy}>
        <h1 id="hero-title" className={styles.title}>
          <RevealText text={site.headline} />
        </h1>
        <p className={`${styles.lede} ${styles.enter}`}>{site.description}</p>
        <div className={`${styles.actions} ${styles.enter} ${styles.later}`}>
          <Button
            href={accountLinks.join.href}
            size="lg"
            event={{ name: 'join_click', location: 'hero' }}
          >
            Join IBC
          </Button>
          <Button
            href="#problem"
            variant="secondary"
            size="lg"
            event={{ name: 'cta_click', cta: 'explore_network', location: 'hero' }}
          >
            Explore the network
          </Button>
        </div>
      </div>
      <div className={`${styles.footnote} ${styles.enter} ${styles.last}`}>
        <NetworkLegend />
        <span className={styles.scrollCue} aria-hidden="true">
          <span className={styles.scrollLine} />
          Scroll to see how it works
        </span>
      </div>
    </section>
  );
}
