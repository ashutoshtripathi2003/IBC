import { ForgotPasswordForm } from '@/components/account/RecoveryForms';
import styles from '@/components/explore/detail.module.css';
import { PageBody, PageHeader } from '@/components/explore/PageHeader';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Reset your password',
  description: 'Request a link to reset your IBC password.',
  path: '/forgot-password',
  index: false,
});

export default function Page() {
  return (
    <>
      <PageHeader
        title="Reset your password"
        crumbs={[{ href: '/forgot-password', label: 'Reset your password' }]}
      />
      <PageBody>
        <div className={styles.panel} style={{ maxWidth: '28rem' }}>
          <p className={styles.note}>
            Enter the email address of your account and we will send you a link to choose a new
            password.
          </p>
          <noscript>
            <p className={styles.note}>This page needs JavaScript to be enabled.</p>
          </noscript>
          <ForgotPasswordForm />
        </div>
      </PageBody>
    </>
  );
}
