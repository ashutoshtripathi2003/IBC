'use client';

import { createContext, useContext } from 'react';
import type { User } from '@/lib/account/client';

export interface AppUserValue {
  user: User;
  setUser: (user: User) => void;
  signOut: () => Promise<void>;
}

export const AppUserContext = createContext<AppUserValue | null>(null);

/** The signed-in user inside the app shell. */
export function useAppUser(): AppUserValue {
  const value = useContext(AppUserContext);
  if (!value) throw new Error('useAppUser must be used inside <AppShell>');
  return value;
}
