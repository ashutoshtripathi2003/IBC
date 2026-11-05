import { Suspense } from 'react';
import styles from '@/components/explore/detail.module.css';
import { PageBody, PageHeader } from '@/components/explore/PageHeader';
import { JoinIntent } from '@/components/account/JoinIntent';
import { SignUpForm } from '@/components/account/SignUpForm';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Join IBC',
  description:
    'Join Industrial Business Circle to list your company, products and services and connect with industry.',
  path: '/join',
});

const BENEFITS = [
  'A company profile describing what you make and where you operate',
  'Product and service listings with specifications and pricing',
  'Quotation requests from buyers, and requests you can send to suppliers',
  'Connections with professionals across industries',
] as const;

export default function JoinPage() {
  return (
    <>
      <PageHeader
        title="Join IBC"
        intro="Membership opens first in Maharashtra, then across India and international markets."
        crumbs={[{ href: '/join', label: 'Join IBC' }]}
      />
      <PageBody>
        <div className={styles.layout}>
          <div className={styles.mainCol}>
            <Suspense fallback={null}>
              <JoinIntent />
            </Suspense>
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>What members get</h2>
              <ul className={styles.roles}>
                {BENEFITS.map((benefit) => (
                  <li key={benefit} className={styles.role}>
                    <Icon name="check" size={20} />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <aside className={`${styles.sideCol} ${styles.sideFirst}`}>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Create your account</h2>
              <SignUpForm
                preLaunch={
                  <>
                    <p className={styles.note}>
                      Creating an account will be available on this page when IBC opens. Until then,
                      explore the platform to see how it works.
                    </p>
                    <Button href="/discover" fullWidth>
                      Explore IBC
                    </Button>
                  </>
                }
              />
            </div>
          </aside>
        </div>
      </PageBody>
    </>
  );
}
