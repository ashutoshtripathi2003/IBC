'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { track, type AnalyticsEvent } from '@/lib/analytics';
import styles from './Button.module.css';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface CommonProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  /** Analytics event sent on activation. */
  event?: AnalyticsEvent;
  className?: string | undefined;
  fullWidth?: boolean;
}

type ButtonProps = CommonProps &
  (
    | { href: string; onClick?: never; type?: never; disabled?: never }
    | { href?: never; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean }
  );

/** The only button in the system: navy primary, gold accent (Join), outline secondary, ghost. */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  event,
  className,
  fullWidth,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.full : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const onActivate = () => {
    if (event) track(event);
  };
  if (rest.href !== undefined) {
    return (
      <Link href={rest.href} className={classes} onClick={onActivate}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type={rest.type ?? 'button'}
      className={classes}
      disabled={rest.disabled}
      onClick={() => {
        onActivate();
        rest.onClick?.();
      }}
    >
      {children}
    </button>
  );
}
