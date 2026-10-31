import { Button } from '@/components/ui/Button';
import { accountLinks } from '@/content/site';
import styles from './FinalCta.module.css';

export function FinalCta() {
  return (
    <section className={styles.cta} aria-labelledby="cta-title">
      <h2 id="cta-title" className={styles.title}>
        Your next connection could change your business.
      </h2>
      <p className={styles.note}>
        IBC is opening first in Maharashtra. Join now to be among its first members.
      </p>
      <div className={styles.actions}>
        <Button
          href={accountLinks.join.href}
          size="lg"
          event={{ name: 'join_click', location: 'final_cta' }}
        >
          Join IBC
        </Button>
        <Button
          href="/network"
          variant="secondary"
          size="lg"
          event={{ name: 'cta_click', cta: 'explore_ibc', location: 'final_cta' }}
        >
          Explore IBC
        </Button>
      </div>
    </section>
  );
}
