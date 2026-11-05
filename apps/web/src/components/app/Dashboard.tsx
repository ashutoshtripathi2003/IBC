'use client';

import { useSearchParams } from 'next/navigation';
import { FormAlert } from '@/components/account/Field';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { AppPage } from './AppPage';
import { useAppUser } from './AppUser';
import { EmailVerificationNotice } from './EmailVerificationNotice';
import styles from './app.module.css';

export function Dashboard() {
  const { user } = useAppUser();
  const welcome = useSearchParams().get('welcome') === '1';
  const firstName = user.displayName.split(/\s+/)[0] ?? user.displayName;
  return (
    <AppPage
      title={`Welcome${welcome ? '' : ' back'}, ${firstName}`}
      intro="Your IBC workspace. Parts of the platform open step by step; each section says what is available today."
    >
      <div className={styles.stack}>
        {welcome && <FormAlert tone="success">Your account has been created.</FormAlert>}
        {!user.emailVerified && <EmailVerificationNotice />}
        <div className={styles.grid}>
          <section className={styles.card} aria-labelledby="start-title">
            <h2 id="start-title" className={styles.cardTitle}>
              Getting started
            </h2>
            <ul className={styles.checklist}>
              <li className={styles.checkItem}>
                <Icon name="check" size={18} className={styles.checkDone} />
                Create your account
              </li>
              <li className={styles.checkItem}>
                <Icon
                  name="check"
                  size={18}
                  className={user.emailVerified ? styles.checkDone : styles.checkOpen}
                />
                Confirm your email address{user.emailVerified ? '' : ' (pending)'}
              </li>
              <li className={styles.checkItem}>
                <Icon
                  name="check"
                  size={18}
                  className={user.countryCode ? styles.checkDone : styles.checkOpen}
                />
                Add your country in settings
              </li>
            </ul>
            <Button href="/app/settings" variant="secondary" size="sm">
              Account settings
            </Button>
          </section>
          <section className={styles.card} aria-labelledby="explore-title">
            <h2 id="explore-title" className={styles.cardTitle}>
              Explore the directory
            </h2>
            <p className={styles.muted}>
              Browse industries, businesses, products and services. Listings marked Demo are
              examples.
            </p>
            <div className={styles.actions}>
              <Button href="/discover" size="sm">
                Discover
              </Button>
              <Button href="/products" variant="secondary" size="sm">
                Products
              </Button>
            </div>
          </section>
          <section className={styles.card} aria-labelledby="next-title">
            <h2 id="next-title" className={styles.cardTitle}>
              Coming next
            </h2>
            <p className={styles.muted}>
              Professional profiles, company pages, product listings, quotation requests and
              messaging will appear in this workspace as they open.
            </p>
          </section>
        </div>
      </div>
    </AppPage>
  );
}
