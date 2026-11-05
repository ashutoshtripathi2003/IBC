import type { ReactNode } from 'react';
import styles from './forms.module.css';

/** A labelled form field with an optional hint and error, wired for assistive technology. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

/** aria attributes for an input rendered inside <Field>. */
export function describedBy(id: string, hint?: string, error?: string) {
  const ids = [error ? `${id}-error` : hint ? `${id}-hint` : null].filter(Boolean);
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': ids.length ? ids.join(' ') : undefined,
  } as const;
}

export function FormAlert({
  children,
  tone = 'error',
}: {
  children: ReactNode;
  tone?: 'error' | 'success' | 'info';
}) {
  return (
    <div className={`${styles.alert} ${styles[tone]}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
