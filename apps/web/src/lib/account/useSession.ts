'use client';

import { useCallback, useEffect, useState } from 'react';
import { account, type User } from './client';

export type SessionState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'error' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: User };

async function load(): Promise<SessionState> {
  try {
    const { accounts, user } = await account.session();
    if (!accounts) return { status: 'unavailable' };
    return user ? { status: 'signed-in', user } : { status: 'signed-out' };
  } catch {
    return { status: 'error' };
  }
}

/** The visitor's account state, from the website's session endpoint. */
export function useSession() {
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  useEffect(() => {
    let cancelled = false;
    void load().then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const refresh = useCallback(async () => {
    setState(await load());
  }, []);
  return { state, setState, refresh };
}
