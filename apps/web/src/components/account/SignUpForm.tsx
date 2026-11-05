'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { account, PASSWORD_MAX, PASSWORD_MIN } from '@/lib/account/client';
import { countryOptions } from '@/lib/account/countries';
import { useSession } from '@/lib/account/useSession';
import { describedBy, Field, FormAlert } from './Field';
import { PasswordInput } from './PasswordInput';
import { useFormState } from './useForm';
import styles from './forms.module.css';

const FIELDS = ['displayName', 'email', 'password', 'countryCode'] as const;
type FieldName = (typeof FIELDS)[number];

function browserLocale(): string | undefined {
  try {
    return Intl.getCanonicalLocales(navigator.language)[0];
  } catch {
    return undefined;
  }
}

/**
 * Account sign-up. Until accounts are available (no API configured) it shows the pre-launch
 * message, which is also what renders without JavaScript.
 */
export function SignUpForm({ preLaunch }: { preLaunch: React.ReactNode }) {
  const id = useId();
  const router = useRouter();
  const { state } = useSession();
  const form = useFormState<FieldName>();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const countries = useMemo(
    () => (state.status === 'signed-out' ? countryOptions() : []),
    [state.status],
  );

  if (state.status === 'loading' || state.status === 'unavailable') return <>{preLaunch}</>;
  if (state.status === 'error') {
    return <FormAlert>IBC is temporarily unavailable. Please try again in a moment.</FormAlert>;
  }
  if (state.status === 'signed-in') {
    return (
      <div className={styles.form}>
        <FormAlert tone="success">You are signed in as {state.user.displayName}.</FormAlert>
        <Button href="/app" fullWidth>
          Go to your dashboard
        </Button>
      </div>
    );
  }

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: Partial<Record<FieldName, string>> = {};
    if (!displayName.trim()) errors.displayName = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errors.email = 'Enter a valid email address.';
    if (password.length < PASSWORD_MIN)
      errors.password = `Use at least ${PASSWORD_MIN} characters.`;
    if (password.length > PASSWORD_MAX) errors.password = `Use at most ${PASSWORD_MAX} characters.`;
    if (Object.keys(errors).length > 0) {
      form.setFields(errors);
      form.setError('Some details need attention.');
      return;
    }
    void form.submit(FIELDS, async () => {
      const locale = browserLocale();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await account.register({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
        ...(locale ? { locale } : {}),
        ...(timezone ? { timezone } : {}),
        ...(countryCode ? { countryCode } : {}),
      });
      router.push('/app?welcome=1');
    });
  };

  const f = form.fields;
  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate aria-label="Create your account">
      {form.error && <FormAlert>{form.error}</FormAlert>}
      <Field id={`${id}-name`} label="Full name" error={f.displayName}>
        <input
          id={`${id}-name`}
          className={styles.input}
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
      <Field id={`${id}-email`} label="Work email" error={f.email}>
        <input
          id={`${id}-email`}
          className={styles.input}
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            form.clearField('email');
          }}
          {...describedBy(`${id}-email`, undefined, f.email)}
        />
      </Field>
      <Field
        id={`${id}-password`}
        label="Password"
        hint={`At least ${PASSWORD_MIN} characters. A short phrase is easy to remember.`}
        error={f.password}
      >
        <PasswordInput
          id={`${id}-password`}
          autoComplete="new-password"
          maxLength={PASSWORD_MAX}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            form.clearField('password');
          }}
          {...describedBy(
            `${id}-password`,
            `At least ${PASSWORD_MIN} characters. A short phrase is easy to remember.`,
            f.password,
          )}
        />
      </Field>
      <Field id={`${id}-country`} label="Country (optional)" error={f.countryCode}>
        <select
          id={`${id}-country`}
          className={styles.input}
          autoComplete="country"
          value={countryCode}
          onChange={(e) => {
            setCountryCode(e.target.value);
            form.clearField('countryCode');
          }}
          {...describedBy(`${id}-country`, undefined, f.countryCode)}
        >
          <option value="">Select a country</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Button type="submit" variant="accent" fullWidth disabled={form.busy}>
        {form.busy ? 'Creating your account…' : 'Create account'}
      </Button>
      <p className={styles.small}>
        Already a member?{' '}
        <Link href="/login" className={styles.link}>
          Log in
        </Link>
      </p>
    </form>
  );
}
