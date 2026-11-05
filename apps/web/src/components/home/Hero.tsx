import { NetworkGraph } from '@/components/network';
import { SearchBox } from '@/components/search/SearchBox';
import { Button } from '@/components/ui/Button';
import { accountLinks, site } from '@/content/site';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>{site.legalName}</p>
          <h1 id="hero-title" className={styles.title}>
            Where Industries Connect.
            <br />
            And Business Moves Forward.
          </h1>
          <p className={styles.lede}>{site.description}</p>
          <SearchBox variant="hero" />
          <div className={styles.actions}>
            <Button
              href="/discover"
              size="lg"
              event={{ name: 'cta_click', cta: 'explore_ibc', location: 'hero' }}
            >
              Explore IBC
            </Button>
            <Button
              href={accountLinks.join.href}
              variant="secondary"
              size="lg"
              event={{ name: 'join_click', location: 'hero' }}
            >
              Join IBC
            </Button>
          </div>
        </div>
        <figure className={styles.visual}>
          <NetworkGraph scene="formation" variant="inline" />
          <figcaption className={styles.caption}>
            <span className={styles.legend}>
              <span className={styles.dot} data-kind="company" /> Companies
            </span>
            <span className={styles.legend}>
              <span className={styles.dot} data-kind="product" /> Products
            </span>
            <span className={styles.legend}>
              <span className={styles.dot} data-kind="person" /> Professionals
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
