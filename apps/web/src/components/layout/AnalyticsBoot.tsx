'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  consoleProvider,
  domEventProvider,
  registerAnalyticsProvider,
  track,
} from '@/lib/analytics';

/** Registers analytics providers once and records page views on navigation. */
export function AnalyticsBoot() {
  const pathname = usePathname();
  useEffect(() => {
    const offDom = registerAnalyticsProvider(domEventProvider);
    const offConsole =
      process.env.NODE_ENV === 'development'
        ? registerAnalyticsProvider(consoleProvider)
        : undefined;
    return () => {
      offDom();
      offConsole?.();
    };
  }, []);
  useEffect(() => {
    track({ name: 'page_view', path: pathname });
  }, [pathname]);
  return null;
}
