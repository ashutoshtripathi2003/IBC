import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { Button } from '@/components/ui/Button';
import styles from '@/components/pages/pages.module.css';

export const metadata: Metadata = pageMetadata({
  title: 'Join IBC',
  description: 'Join IBC — Indian Business Circle, the network where business happens.',
  path: '/join',
});

export default function JoinPage() {
  return (
    <section className={styles.account} aria-labelledby="join-title">
      <p className={styles.kicker}>Join IBC</p>
      <h1 id="join-title" className={styles.headline}>
        Membership opens first in Maharashtra.
      </h1>
      <p className={styles.lede}>
        Creating an account will be available on this page when IBC opens. You will be able to set
        up your profile, add your business and start connecting.
      </p>
      <Button href="/about" variant="secondary" size="lg">
        Learn about IBC
      </Button>
    </section>
  );
}
