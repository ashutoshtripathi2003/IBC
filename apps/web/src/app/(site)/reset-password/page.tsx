import { ResetPasswordForm } from '@/components/account/RecoveryForms';
import styles from '@/components/explore/detail.module.css';
import { PageBody, PageHeader } from '@/components/explore/PageHeader';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Choose a new password',
  description: 'Set a new password for your IBC account.',
  path: '/reset-password',
  index: false,
});

export default function Page() {
  return (
    <>
      <PageHeader
        title="Choose a new password"
        crumbs={[{ href: '/reset-password', label: 'Choose a new password' }]}
      />
      <PageBody>
        <div className={styles.panel} style={{ maxWidth: '28rem' }}>
          <p className={styles.note}>Choose a new password for your IBC account.</p>
          <noscript>
            <p className={styles.note}>This page needs JavaScript to be enabled.</p>
          </noscript>
          <ResetPasswordForm />
        </div>
      </PageBody>
    </>
  );
}
