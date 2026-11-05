'use client';

import { useCallback, useEffect, useId, useMemo, useState, type SyntheticEvent } from 'react';
import { describedBy, Field, FormAlert } from '@/components/account/Field';
import { useFormState } from '@/components/account/useForm';
import formStyles from '@/components/account/forms.module.css';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { account, AccountError, type SessionInfo } from '@/lib/account/client';
import { countryOptions } from '@/lib/account/countries';
import { AppPage } from './AppPage';
import { useAppUser } from './AppUser';
import { EmailVerificationNotice } from './EmailVerificationNotice';
import styles from './app.module.css';

const DETAIL_FIELDS = ['displayName', 'countryCode', 'timezone', 'locale'] as const;
type DetailField = (typeof DETAIL_FIELDS)[number];

function AccountDetails() {
  const id = useId();
  const { user, setUser } = useAppUser();
  const form = useFormState<DetailField>();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [countryCode, setCountryCode] = useState(user.countryCode ?? '');
  const [timezone, setTimezone] = useState(user.timezone);
  const [locale, setLocale] = useState(user.locale);
  const [saved, setSaved] = useState(false);
  const countries = useMemo(() => countryOptions(), []);
  const zones = useMemo(() => {
    const list = Intl.supportedValuesOf('timeZone');
    return list.includes(user.timezone) ? list : [user.timezone, ...list];
  }, [user.timezone]);

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(false);
    if (!displayName.trim()) {
      form.setFields({ displayName: 'Enter your name.' });
      return;
    }
    void form.submit(DETAIL_FIELDS, async () => {
      const { user: updated } = await account.updateMe({
        displayName: displayName.trim(),
        countryCode: countryCode || null,
        timezone,
        locale: locale.trim(),
      });
      setUser(updated);
      setSaved(true);
    });
  };

  const f = form.fields;
  return (
    <section className={styles.card} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={styles.cardTitle}>
        Account details
      </h2>
      <form className={formStyles.form} onSubmit={onSubmit} noValidate>
        {form.error && <FormAlert>{form.error}</FormAlert>}
        {saved && !form.error && (
          <FormAlert tone="success">Your details have been saved.</FormAlert>
        )}
        <Field id={`${id}-name`} label="Full name" error={f.displayName}>
          <input
            id={`${id}-name`}
            className={formStyles.input}
            autoComplete="name"
            maxLength={100}
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              form.clearField('displayName');
            }}
            {...describedBy(`${id}-name`, undefined, f.displayName)}
          />
        </Field>
        <Field id={`${id}-country`} label="Country" error={f.countryCode}>
          <select
            id={`${id}-country`}
            className={formStyles.input}
            value={countryCode}
            onChange={(e) => {
              setCountryCode(e.target.value);
              form.clearField('countryCode');
            }}
            {...describedBy(`${id}-country`, undefined, f.countryCode)}
          >
            <option value="">Not set</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id={`${id}-tz`} label="Time zone" error={f.timezone}>
          <select
            id={`${id}-tz`}
            className={formStyles.input}
            value={timezone}
            onChange={(e) => {
              setTimezone(e.target.value);
              form.clearField('timezone');
            }}
            {...describedBy(`${id}-tz`, undefined, f.timezone)}
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id={`${id}-locale`}
          label="Language and region"
          hint="A language tag, for example en-IN or en-GB."
          error={f.locale}
        >
          <input
            id={`${id}-locale`}
            className={formStyles.input}
            maxLength={35}
            value={locale}
            onChange={(e) => {
              setLocale(e.target.value);
              form.clearField('locale');
            }}
            {...describedBy(
              `${id}-locale`,
              'A language tag, for example en-IN or en-GB.',
              f.locale,
            )}
          />
        </Field>
        <div>
          <Button type="submit" disabled={form.busy}>
            {form.busy ? 'Saving…' : 'Save details'}
          </Button>
        </div>
      </form>
    </section>
  );
}

function describeDevice(userAgent: string | null): string {
  if (!userAgent) return 'Unknown device';
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\//.test(userAgent)
      ? 'Chrome'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : 'Browser';
  const os = /Android/.test(userAgent)
    ? 'Android'
    : /iPhone|iPad/.test(userAgent)
      ? 'iOS'
      : /Windows/.test(userAgent)
        ? 'Windows'
        : /Mac OS X/.test(userAgent)
          ? 'macOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : 'unknown system';
  return `${browser} on ${os}`;
}

function Sessions() {
  const { signOut } = useAppUser();
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const load = useCallback(
    () =>
      account.sessions().then(
        (result) => {
          setSessions(result.sessions);
          setError(null);
        },
        (caught: unknown) => {
          setError(
            caught instanceof AccountError ? caught.message : 'Could not load your sessions.',
          );
        },
      ),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);

  const revoke = async (session: SessionInfo) => {
    if (session.current) {
      await signOut();
      return;
    }
    setBusyId(session.id);
    try {
      await account.revokeSession(session.id);
      await load();
    } catch (caught) {
      setError(caught instanceof AccountError ? caught.message : 'Could not sign out that device.');
    } finally {
      setBusyId(null);
    }
  };

  const when = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <section className={styles.card} aria-labelledby="sessions-title">
      <h2 id="sessions-title" className={styles.cardTitle}>
        Where you are signed in
      </h2>
      <p className={styles.muted}>
        If you do not recognise a device, sign it out and change your password.
      </p>
      {error && <FormAlert>{error}</FormAlert>}
      {sessions === null && !error && (
        <p role="status" className={styles.muted}>
          Loading…
        </p>
      )}
      {sessions && (
        <ul className={styles.sessionList}>
          {sessions.map((s) => (
            <li key={s.id} className={styles.session}>
              <div className={styles.sessionText}>
                <strong>
                  {describeDevice(s.userAgent)}{' '}
                  {s.current && <Badge tone="neutral">This device</Badge>}
                </strong>
                <span className={styles.muted}>
                  Signed in {when.format(new Date(s.createdAt))}
                  {s.lastSeenAt ? ` · last active ${when.format(new Date(s.lastSeenAt))}` : ''}
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={busyId === s.id}
                onClick={() => {
                  void revoke(s);
                }}
              >
                {s.current ? 'Log out' : busyId === s.id ? 'Signing out…' : 'Sign out device'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Settings() {
  const { user } = useAppUser();
  return (
    <AppPage title="Settings" intro="Manage your account details and where you are signed in.">
      <div className={styles.stack}>
        <section className={styles.card} aria-labelledby="email-title">
          <h2 id="email-title" className={styles.cardTitle}>
            Email
          </h2>
          <p>
            {user.email}{' '}
            {user.emailVerified ? (
              <Badge tone="verified">Confirmed</Badge>
            ) : (
              <Badge tone="neutral">Not confirmed</Badge>
            )}
          </p>
          {!user.emailVerified && <EmailVerificationNotice />}
          <p className={styles.muted}>
            To change your password, use{' '}
            <a href="/forgot-password" className={formStyles.link}>
              reset password
            </a>
            . Every device is signed out afterwards.
          </p>
        </section>
        <AccountDetails />
        <Sessions />
      </div>
    </AppPage>
  );
}
