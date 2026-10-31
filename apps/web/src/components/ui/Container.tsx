import type { ElementType, ReactNode } from 'react';
import styles from './layout.module.css';

export function Container({
  children,
  as: Tag = 'div',
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string | undefined;
}) {
  return <Tag className={[styles.container, className].filter(Boolean).join(' ')}>{children}</Tag>;
}
