'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useId, useState, type ReactNode, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { account, safeNext } from '@/lib/account/client';
import { useSession } from '@/lib/account/useSession';
import { describedBy, Field, FormAlert } from './Field';
import { PasswordInput } from './PasswordInput';
import { useFormState } from './useForm';
import styles from './forms.module.css';

const FIELDS = ['email', 'password'] as const;
type FieldName = (typeof FIELDS)[number];

export function LoginForm({ preLaunch }: { preLaunch: ReactNode }) {
  const id = useId();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const { state } = useSession();
  const form = useFormState<FieldName>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (state.status === 'loading' || state.status === 'unavailable') return <>{preLaunch}</>;
  if (state.status === 'error') {
    return <FormAlert>IBC is temporarily unavailable. Please try again in a moment.</FormAlert>;
  }
  if (state.status === 'signed-in') {
    return (
      <div className={styles.form}>
        <FormAlert tone="success">You are signed in as {state.user.displayName}.</FormAlert>
        <Button href={next} fullWidth>
          Continue
        </Button>
      </div>
    );
  }

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: Partial<Record<FieldName, string>> = {};
    if (!email.trim()) errors.email = 'Enter your email address.';
    if (!password) errors.password = 'Enter your password.';
    if (Object.keys(errors).length > 0) {
      form.setFields(errors);
      form.setError(null);
      return;
    }
    void form.submit(FIELDS, async () => {
      await account.login({ email: email.trim(), password });
      router.push(next);
    });
  };

  const f = form.fields;
  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate aria-label="Log in">
      {params.get('ended') === '1' && !form.error && (
        <FormAlert tone="info">Your session has ended. Please log in again.</FormAlert>
      )}
      {form.error && <FormAlert>{form.error}</FormAlert>}
      <Field id={`${id}-email`} label="Email" error={f.email}>
        <input
          id={`${id}-email`}
          className={styles.input}
          type="email"
          autoComplete="username"
          inputMode="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            form.clearField('email');
          }}
          {...describedBy(`${id}-email`, undefined, f.email)}
        />
      </Field>
      <Field id={`${id}-password`} label="Password" error={f.password}>
        <PasswordInput
          id={`${id}-password`}
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            form.clearField('password');
          }}
          {...describedBy(`${id}-password`, undefined, f.password)}
        />
      </Field>
      <div className={styles.row}>
        <Link href="/forgot-password" className={styles.link}>
          Forgot your password?
        </Link>
      </div>
      <Button type="submit" fullWidth disabled={form.busy}>
        {form.busy ? 'Logging in…' : 'Log in'}
      </Button>
      <p className={styles.small}>
        New to IBC?{' '}
        <Link href="/join" className={styles.link}>
          Create an account
        </Link>
      </p>
    </form>
  );
}
