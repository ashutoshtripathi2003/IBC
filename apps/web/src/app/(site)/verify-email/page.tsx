import { VerifyEmail } from '@/components/account/RecoveryForms';
import styles from '@/components/explore/detail.module.css';
import { PageBody, PageHeader } from '@/components/explore/PageHeader';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Confirm your email',
  description: 'Confirm the email address of your IBC account.',
  path: '/verify-email',
  index: false,
});

export default function Page() {
  return (
    <>
      <PageHeader
        title="Confirm your email"
        crumbs={[{ href: '/verify-email', label: 'Confirm your email' }]}
      />
      <PageBody>
        <div className={styles.panel} style={{ maxWidth: '28rem' }}>
          <p className={styles.note}>Confirming the email address for your IBC account.</p>
          <noscript>
            <p className={styles.note}>This page needs JavaScript to be enabled.</p>
          </noscript>
          <VerifyEmail />
        </div>
      </PageBody>
    </>
  );
}
