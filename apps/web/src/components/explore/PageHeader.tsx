import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

export interface Crumb {
  href: string;
  label: string;
}

/** Page title band with breadcrumbs; used by every inner page. */
export function PageHeader({
  title,
  intro,
  crumbs = [],
  aside,
  children,
}: {
  title: string;
  intro?: string;
  crumbs?: Crumb[];
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb">
            <ol className={styles.crumbs}>
              <li>
                <Link href="/">Home</Link>
              </li>
              {crumbs.map((crumb) => (
                <li key={crumb.href}>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className={styles.row}>
          <div className={styles.text}>
            <h1 className={styles.title}>{title}</h1>
            {intro && <p className={styles.intro}>{intro}</p>}
          </div>
          {aside}
        </div>
        {children}
      </div>
    </header>
  );
}

export function PageBody({ children }: { children: ReactNode }) {
  return <div className={styles.body}>{children}</div>;
}
