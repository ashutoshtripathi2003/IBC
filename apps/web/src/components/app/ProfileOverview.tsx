'use client';

import { Button } from '@/components/ui/Button';
import { Monogram } from '@/components/ui/Monogram';
import { countryName } from '@/lib/geo';
import { AppPage, NotYetAvailable } from './AppPage';
import { useAppUser } from './AppUser';
import styles from './app.module.css';

export function ProfileOverview() {
  const { user } = useAppUser();
  const since = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
    new Date(user.createdAt),
  );
  return (
    <AppPage title="My Profile" intro="Only you can see this page. Public profiles open later.">
      <div className={styles.stack}>
        <section className={styles.card} aria-labelledby="profile-name">
          <div className={styles.actions} style={{ alignItems: 'center' }}>
            <Monogram name={user.displayName} size={56} shape="circle" />
            <div>
              <h2 id="profile-name" className={styles.cardTitle}>
                {user.displayName}
              </h2>
              <p className={styles.muted}>Member since {since}</p>
            </div>
          </div>
          <dl className={styles.facts}>
            <dt>Country</dt>
            <dd>{user.countryCode ? countryName(user.countryCode) : 'Not set'}</dd>
            <dt>Language</dt>
            <dd>{user.locale}</dd>
            <dt>Time zone</dt>
            <dd>{user.timezone}</dd>
          </dl>
          <div>
            <Button href="/app/settings" variant="secondary" size="sm">
              Edit in settings
            </Button>
          </div>
        </section>
        <NotYetAvailable icon="briefcase" title="Professional profile">
          Your roles, companies, expertise and industries will be added here. A person can hold
          several roles, for example at a company and an industry association.
        </NotYetAvailable>
      </div>
    </AppPage>
  );
}
