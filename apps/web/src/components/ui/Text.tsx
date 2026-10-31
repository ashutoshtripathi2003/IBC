import type { ElementType, ReactNode } from 'react';
import styles from './Text.module.css';

type HeadingSize = 'display' | 'headline' | 'subheadline';
type TextVariant = 'lead' | 'body' | 'label' | 'meta';

/** Headings: the semantic level (`as`) is independent of the visual size. */
export function Heading({
  as: Tag = 'h2',
  size = 'headline',
  id,
  children,
  className,
}: {
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  size?: HeadingSize;
  id?: string;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <Tag id={id} className={[styles[size], className].filter(Boolean).join(' ')}>
      {children}
    </Tag>
  );
}

export function Text({
  as: Tag = 'p',
  variant = 'body',
  tone = 'default',
  children,
  className,
}: {
  as?: ElementType;
  variant?: TextVariant;
  tone?: 'default' | 'muted' | 'subtle';
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <Tag className={[styles[variant], styles[tone], className].filter(Boolean).join(' ')}>
      {children}
    </Tag>
  );
}
