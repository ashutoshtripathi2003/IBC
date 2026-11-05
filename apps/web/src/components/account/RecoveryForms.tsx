'use client';

import Link from 'next/link';
import { useEffect, useId, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/Button';
import {
  account,
  AccountError,
  PASSWORD_MAX,
  PASSWORD_MIN,
  tokenFromFragment,
} from '@/lib/account/client';
import { describedBy, Field, FormAlert } from './Field';
import { PasswordInput } from './PasswordInput';
import { useFormState } from './useForm';
import styles from './forms.module.css';

/** Asks for a reset link. The answer is the same whether or not the account exists. */
export function ForgotPasswordForm() {
  const id = useId();
  const form = useFormState<'email'>();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className={styles.form}>
        <FormAlert tone="success">
          If an account exists for {email.trim()}, we have sent a link to reset its password. The
          link works for 30 minutes.
        </FormAlert>
        <Link href="/login" className={styles.link}>
          Back to log in
        </Link>
      </div>
    );
  }

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      form.setFields({ email: 'Enter a valid email address.' });
      return;
    }
    void form.submit(['email'], async () => {
      await account.requestPasswordReset(email.trim());
      setSent(true);
    });
  };

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate aria-label="Reset your password">
      {form.error && <FormAlert>{form.error}</FormAlert>}
      <Field id={`${id}-email`} label="Email" error={form.fields.email}>
        <input
          id={`${id}-email`}
          className={styles.input}
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            form.clearField('email');
          }}
          {...describedBy(`${id}-email`, undefined, form.fields.email)}
        />
      </Field>
      <Button type="submit" fullWidth disabled={form.busy}>
        {form.busy ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  );
}

/** Reads the one-time token from the URL fragment and removes it from the address bar. */
function useFragmentToken() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const found = tokenFromFragment(window.location.hash);
    if (window.location.hash) {
      // Keep the token out of history and screenshots once read.
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    // Reading the URL fragment is only possible in the browser, after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(found);
  }, []);
  return token;
}

export function ResetPasswordForm() {
  const id = useId();
  const token = useFragmentToken();
  const form = useFormState<'newPassword'>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [done, setDone] = useState(false);

  if (token === undefined) return null;
  if (token === null) {
    return (
      <div className={styles.form}>
        <FormAlert>
          This reset link is incomplete. Open the link from your email again, or request a new one.
        </FormAlert>
        <Button href="/forgot-password">Request a new link</Button>
      </div>
    );
  }
  if (done) {
    return (
      <div className={styles.form}>
        <FormAlert tone="success">
          Your password has been changed. For your security, every device has been signed out.
        </FormAlert>
        <Button href="/login">Log in</Button>
      </div>
    );
  }

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
      form.setFields({ newPassword: `Use ${PASSWORD_MIN} to ${PASSWORD_MAX} characters.` });
      return;
    }
    if (password !== confirm) {
      setConfirmError('The passwords do not match.');
      return;
    }
    void form.submit(['newPassword'], async () => {
      await account.resetPassword(token, password);
      setDone(true);
    });
  };

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate aria-label="Choose a new password">
      {form.error && <FormAlert>{form.error}</FormAlert>}
      <Field
        id={`${id}-new`}
        label="New password"
        hint={`At least ${PASSWORD_MIN} characters.`}
        error={form.fields.newPassword}
      >
        <PasswordInput
          id={`${id}-new`}
          autoComplete="new-password"
          maxLength={PASSWORD_MAX}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            form.clearField('newPassword');
          }}
          {...describedBy(
            `${id}-new`,
            `At least ${PASSWORD_MIN} characters.`,
            form.fields.newPassword,
          )}
        />
      </Field>
      <Field id={`${id}-confirm`} label="Repeat new password" error={confirmError}>
        <PasswordInput
          id={`${id}-confirm`}
          autoComplete="new-password"
          maxLength={PASSWORD_MAX}
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setConfirmError(undefined);
          }}
          {...describedBy(`${id}-confirm`, undefined, confirmError)}
        />
      </Field>
      <Button type="submit" fullWidth disabled={form.busy}>
        {form.busy ? 'Saving…' : 'Change password'}
      </Button>
    </form>
  );
}

export function VerifyEmail() {
  const token = useFragmentToken();
  const [result, setResult] = useState<'pending' | 'ok' | 'error'>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    account
      .confirmEmail(token)
      .then(() => {
        if (!cancelled) setResult('ok');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setResult('error');
        setMessage(error instanceof AccountError ? error.message : 'Something went wrong.');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (token === undefined) return null;
  if (token === null) {
    return (
      <FormAlert>
        This verification link is incomplete. Open the link from your email again.
      </FormAlert>
    );
  }
  if (result === 'pending')
    return <FormAlert tone="info">Confirming your email address…</FormAlert>;
  if (result === 'ok') {
    return (
      <div className={styles.form}>
        <FormAlert tone="success">Your email address is confirmed.</FormAlert>
        <Button href="/app">Go to your dashboard</Button>
      </div>
    );
  }
  return (
    <div className={styles.form}>
      <FormAlert>{message} You can send a new link from your account settings.</FormAlert>
      <Button href="/app/settings">Account settings</Button>
    </div>
  );
}
