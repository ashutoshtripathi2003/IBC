import type { ReactNode } from 'react';
import { NetworkGraph, type NodeKind } from '@/components/network';
import styles from './pages.module.css';

/** Opening block shared by inner pages: statement on the left, a focused network on the right. */
export function PageHero({
  title,
  headline,
  lede,
  focus,
  children,
}: {
  title: string;
  headline: string;
  lede: string;
  focus: NodeKind;
  children?: ReactNode;
}) {
  return (
    <section className={styles.hero} aria-labelledby="page-title">
      <div className={styles.heroCopy}>
        <p className={styles.kicker}>{title}</p>
        <h1 id="page-title" className={styles.headline}>
          {headline}
        </h1>
        <p className={styles.lede}>{lede}</p>
        {children}
      </div>
      <div className={styles.heroVisual}>
        <NetworkGraph scene="focus" focusKind={focus} variant="inline" />
      </div>
    </section>
  );
}
