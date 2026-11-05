'use client';

import { useState } from 'react';
import { FormAlert } from '@/components/account/Field';
import { Button } from '@/components/ui/Button';
import { account, AccountError } from '@/lib/account/client';
import { useAppUser } from './AppUser';

export function EmailVerificationNotice() {
  const { user } = useAppUser();
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);
  const resend = async () => {
    setState('busy');
    setError(null);
    try {
      await account.resendVerification();
      setState('sent');
    } catch (caught) {
      setState('idle');
      setError(caught instanceof AccountError ? caught.message : 'Something went wrong.');
    }
  };
  return (
    <FormAlert tone="info">
      <p>
        Confirm your email address: we sent a link to <strong>{user.email}</strong>.
      </p>
      {state === 'sent' ? (
        <p>A new link is on its way. Earlier links no longer work.</p>
      ) : (
        <div style={{ marginTop: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            size="sm"
            disabled={state === 'busy'}
            onClick={() => {
              void resend();
            }}
          >
            {state === 'busy' ? 'Sending…' : 'Send a new link'}
          </Button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </FormAlert>
  );
}
