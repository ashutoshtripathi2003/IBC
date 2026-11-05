/** Site-wide copy and navigation. Content lives here, not inside components. */
export const site = {
  name: 'IBC',
  fullName: 'IBC — Industrial Business Circle',
  legalName: 'Industrial Business Circle',
  tagline: 'The global industrial and business network',
  motto: 'Connect. Collaborate. Grow together.',
  headline: 'Where Industries Connect. And Business Moves Forward.',
  description:
    'Discover manufacturers, connect with suppliers, explore industrial products and build business relationships across borders.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001',
} as const;

export interface NavItem {
  href: string;
  label: string;
  summary: string;
}

export const primaryNav: readonly NavItem[] = [
  { href: '/discover', label: 'Discover', summary: 'Browse industries and search everything' },
  {
    href: '/businesses',
    label: 'Businesses',
    summary: 'Manufacturers, suppliers and service firms',
  },
  { href: '/products', label: 'Products', summary: 'Industrial products with specifications' },
  { href: '/services', label: 'Services', summary: 'Engineering, logistics and expertise' },
  { href: '/network', label: 'Network', summary: 'Professionals across industries' },
  { href: '/opportunities', label: 'Opportunities', summary: 'RFQs, partnerships and enquiries' },
  { href: '/about', label: 'About', summary: 'Why IBC exists' },
];

export const accountLinks = {
  join: { href: '/join', label: 'Join IBC' },
  login: { href: '/login', label: 'Log in' },
} as const;

/** Shown wherever demonstration listings appear. */
export const demoNotice =
  'IBC is preparing to launch. Listings marked Demo are fictional examples that show how the platform works.';
