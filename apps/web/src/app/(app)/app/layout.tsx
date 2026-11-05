import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/app/AppShell';

export const metadata: Metadata = {
  title: { default: 'Dashboard', template: '%s | IBC' },
  robots: { index: false, follow: false },
};

/** Signed-in application. Personal data is fetched after sign-in; pages hold none. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
