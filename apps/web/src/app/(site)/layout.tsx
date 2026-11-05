import type { ReactNode } from 'react';
import { SiteChrome } from '@/components/layout/SiteChrome';

/** Public website: header, content, footer. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
