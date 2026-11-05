'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { Brand } from '@/components/layout/Brand';
import { Icon } from '@/components/ui/Icon';
import { Monogram } from '@/components/ui/Monogram';
import { account, type User } from '@/lib/account/client';
import { useSession } from '@/lib/account/useSession';
import { AppUserContext } from './AppUser';
import { APP_NAV } from './nav';
import styles from './app.module.css';

/**
 * Signed-in application frame. The page itself is static and holds no data; everything
 * personal is loaded from the website's session endpoints, which the API authorizes.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, setState } = useSession();

  useEffect(() => {
    if (state.status === 'signed-out') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [state.status, router, pathname]);

  const setUser = useCallback(
    (user: User) => {
      setState({ status: 'signed-in', user });
    },
    [setState],
  );
  const signOut = useCallback(async () => {
    try {
      await account.logout();
    } finally {
      setState({ status: 'signed-out' });
      router.replace('/login');
    }
  }, [router, setState]);

  const value = useMemo(
    () => (state.status === 'signed-in' ? { user: state.user, setUser, signOut } : null),
    [state, setUser, signOut],
  );

  if (state.status === 'unavailable' || state.status === 'error') {
    return (
      <div className={styles.gate}>
        <Brand />
        <h1>
          {state.status === 'unavailable'
            ? 'Accounts are not open yet'
            : 'IBC is temporarily unavailable'}
        </h1>
        <p>
          {state.status === 'unavailable'
            ? 'The signed-in area opens when IBC launches.'
            : 'Please try again in a moment.'}
        </p>
        <Link href="/" className={styles.gateLink}>
          Go to the home page
        </Link>
      </div>
    );
  }

  if (!value) {
    return (
      <div className={styles.gate} aria-busy="true">
        <Brand />
        <p role="status">Loading your account…</p>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === '/app' ? pathname === '/app' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <AppUserContext.Provider value={value}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link href="/app" className={styles.brandLink} aria-label="IBC dashboard">
            <Brand />
          </Link>
          <div className={styles.userBox}>
            <Monogram name={value.user.displayName} size={32} shape="circle" />
            <span className={styles.userName}>{value.user.displayName}</span>
            <button
              type="button"
              className={styles.signOut}
              onClick={() => {
                void signOut();
              }}
            >
              <Icon name="logout" size={18} />
              <span>Log out</span>
            </button>
          </div>
        </header>
        <nav className={styles.sidebar} aria-label="Application">
          <ul>
            {APP_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={styles.navLink}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <Icon name={item.icon} size={18} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main id="main" className={styles.content}>
          {children}
        </main>
      </div>
    </AppUserContext.Provider>
  );
}
