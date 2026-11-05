import { Suspense } from 'react';
import { LoginForm } from '@/components/account/LoginForm';
import styles from '@/components/explore/detail.module.css';
import { PageBody, PageHeader } from '@/components/explore/PageHeader';
import { Button } from '@/components/ui/Button';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Log in',
  description: 'Log in to Industrial Business Circle.',
  path: '/login',
  index: false,
});

const preLaunch = (
  <>
    <p className={styles.note}>
      IBC has not opened yet. When it does, you will log in to your account on this page.
    </p>
    <Button href="/join" variant="accent">
      Join IBC
    </Button>
  </>
);

export default function LoginPage() {
  return (
    <>
      <PageHeader title="Log in" crumbs={[{ href: '/login', label: 'Log in' }]} />
      <PageBody>
        <div className={styles.panel} style={{ maxWidth: '28rem' }}>
          <h2 className={styles.panelTitle}>Welcome back</h2>
          <Suspense fallback={preLaunch}>
            <LoginForm preLaunch={preLaunch} />
          </Suspense>
        </div>
      </PageBody>
    </>
  );
}
