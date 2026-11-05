import type { ReactNode } from 'react';
import { Icon, type UiIcon } from '@/components/ui/Icon';
import styles from './app.module.css';

export function AppPage({
  title,
  intro,
  actions,
  children,
}: {
  title: string;
  intro?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{title}</h1>
          {intro && <p className={styles.pageIntro}>{intro}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {children}
    </>
  );
}

/**
 * Honest placeholder for a part of the product that is not built yet: says what will be
 * here, without showing invented data.
 */
export function NotYetAvailable({
  icon,
  title,
  children,
  actions,
}: {
  icon: UiIcon;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className={styles.empty} aria-label={title}>
      <span className={styles.emptyIcon} aria-hidden="true">
        <Icon name={icon} size={24} />
      </span>
      <h2 className={styles.cardTitle}>{title}</h2>
      <div className={styles.muted}>{children}</div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </section>
  );
}
