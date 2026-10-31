import { Button } from '@/components/ui/Button';
import { accountLinks } from '@/content/site';
import styles from './pages.module.css';

export function JoinBand({ location }: { location: string }) {
  return (
    <section className={styles.band} aria-labelledby="join-band-title">
      <h2 id="join-band-title" className={styles.bandTitle}>
        Be part of the network from the start.
      </h2>
      <Button href={accountLinks.join.href} size="lg" event={{ name: 'join_click', location }}>
        Join IBC
      </Button>
    </section>
  );
}
