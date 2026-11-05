'use client';

import { useState } from 'react';
import { AccountError } from '@/lib/account/client';

/** Submission state shared by the account forms: busy flag, form error, field errors. */
export function useFormState<F extends string>() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Partial<Record<F, string>>>({});

  const clearField = (name: F) => {
    setFields((current) => {
      if (!current[name]) return current;
      return { ...current, [name]: undefined };
    });
  };

  /** Runs a submission; maps API field errors (by path) onto the known fields. */
  const submit = async (known: readonly F[], action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (caught) {
      if (caught instanceof AccountError) {
        const mapped: Partial<Record<F, string>> = {};
        for (const f of caught.fields) {
          const name = f.path.split('.')[0] as F;
          if (known.includes(name) && !mapped[name]) mapped[name] = f.message;
        }
        setFields(mapped);
        setError(caught.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, setError, fields, setFields, clearField, submit };
}
