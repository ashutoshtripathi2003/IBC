import { Button } from '@/components/ui/Button';
import styles from '@/components/pages/pages.module.css';

export default function NotFound() {
  return (
    <section className={styles.account} aria-labelledby="nf-title">
      <p className={styles.kicker}>Page not found</p>
      <h1 id="nf-title" className={styles.headline}>
        This thread doesn’t lead anywhere.
      </h1>
      <p className={styles.lede}>The page may have moved, or the link may be mistyped.</p>
      <Button href="/" size="lg">
        Go to the home page
      </Button>
    </section>
  );
}
