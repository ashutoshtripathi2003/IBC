import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { Button } from '@/components/ui/Button';
import styles from '@/components/pages/pages.module.css';

export const metadata: Metadata = pageMetadata({
  title: 'Log in',
  description: 'Log in to IBC — Indian Business Circle.',
  path: '/login',
  index: false,
});

export default function LoginPage() {
  return (
    <section className={styles.account} aria-labelledby="login-title">
      <p className={styles.kicker}>Log in</p>
      <h1 id="login-title" className={styles.headline}>
        Members will sign in here.
      </h1>
      <p className={styles.lede}>
        IBC has not opened yet. When it does, you will log in to your account on this page.
      </p>
      <Button href="/join" size="lg" event={{ name: 'join_click', location: 'login_page' }}>
        Join IBC
      </Button>
    </section>
  );
}
