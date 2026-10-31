import type { ElementType, ReactNode } from 'react';
import styles from './Card.module.css';

/**
 * Surface for product UI fragments (profiles, companies, products). Edges are drawn as a
 * single thread (top border in the node kind's colour) instead of a generic shadowed box.
 */
export function Card({
  as: Tag = 'article',
  accent = 'person',
  children,
  className,
}: {
  as?: ElementType;
  accent?: 'person' | 'company' | 'product' | 'service' | 'opportunity' | 'trust';
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <Tag className={[styles.card, styles[accent], className].filter(Boolean).join(' ')}>
      {children}
    </Tag>
  );
}
