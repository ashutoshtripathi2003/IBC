import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './PageSection.module.css';

/** A titled band of the page with an optional "see all" link. */
export function PageSection({
  id,
  title,
  intro,
  action,
  tone = 'plain',
  children,
}: {
  id?: string;
  title: string;
  intro?: string;
  action?: { href: string; label: string };
  tone?: 'plain' | 'white' | 'navy';
  children: ReactNode;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={`${styles.band} ${styles[tone]}`}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <div className={styles.headText}>
            <h2 id={headingId} className={styles.title}>
              {title}
            </h2>
            {intro && <p className={styles.intro}>{intro}</p>}
          </div>
          {action && (
            <Link href={action.href} className={styles.action}>
              {action.label}
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className={styles.container}>{children}</div>;
}
