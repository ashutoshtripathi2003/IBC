'use client';

import { motion, useMotionValue, useSpring } from 'motion/react';
import Link from 'next/link';
import type { PointerEvent, ReactNode } from 'react';
import { track, type AnalyticsEvent } from '@/lib/analytics';
import { springs } from '@/lib/motion';
import { useFinePointer, usePrefersReducedMotion } from '@/lib/motion/hooks';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'quiet';
type Size = 'md' | 'lg';

interface CommonProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  /** Analytics event sent on activation. */
  event?: AnalyticsEvent;
  className?: string | undefined;
}

type ButtonProps = CommonProps &
  (
    | { href: string; onClick?: never; type?: never }
    | { href?: never; onClick?: () => void; type?: 'button' | 'submit' }
  );

const MAX_PULL = 6;
const MotionLink = motion.create(Link);

/**
 * The only button in the system. Primary buttons lean slightly toward the pointer
 * (a "magnetic" response) on devices with a precise pointer and motion enabled.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  event,
  className,
  ...rest
}: ButtonProps) {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const magnetic = variant === 'primary' && fine && !reduced;
  const x = useSpring(useMotionValue(0), springs.soft);
  const y = useSpring(useMotionValue(0), springs.soft);

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!magnetic) return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(((e.clientX - rect.left) / rect.width - 0.5) * 2 * MAX_PULL);
    y.set(((e.clientY - rect.top) / rect.height - 0.5) * 2 * MAX_PULL);
  };
  const onPointerLeave = () => {
    x.set(0);
    y.set(0);
  };
  const onActivate = () => {
    if (event) track(event);
  };

  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');
  const motionProps = {
    className: classes,
    style: magnetic ? { x, y } : {},
    onPointerMove,
    onPointerLeave,
    'data-cursor': 'action',
  };
  const content = (
    <>
      <span className={styles.label}>{children}</span>
      {variant !== 'quiet' && <span className={styles.sheen} aria-hidden="true" />}
    </>
  );

  if (rest.href !== undefined) {
    return (
      <MotionLink href={rest.href} {...motionProps} onClick={onActivate}>
        {content}
      </MotionLink>
    );
  }
  return (
    <motion.button
      {...motionProps}
      type={rest.type ?? 'button'}
      onClick={() => {
        onActivate();
        rest.onClick?.();
      }}
    >
      {content}
    </motion.button>
  );
}
