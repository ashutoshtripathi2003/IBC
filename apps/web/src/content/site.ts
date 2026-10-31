import type { NodeKind } from '@/components/network/engine';

/** Site-wide copy and navigation. Content lives here, not inside components. */
export const site = {
  name: 'IBC',
  fullName: 'IBC — Indian Business Circle',
  tagline: 'The Global Professional + Business + Commerce Network',
  headline: 'The network where business happens.',
  description:
    'Connect with people. Discover businesses. Find products and services. Build relationships. Do business globally.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001',
} as const;

export interface NavItem {
  href: string;
  label: string;
  /** Short description used in the mobile menu and on the page itself. */
  summary: string;
}

export const primaryNav: readonly NavItem[] = [
  { href: '/network', label: 'Network', summary: 'People and companies, connected' },
  { href: '/businesses', label: 'Businesses', summary: 'Find and be found' },
  { href: '/products', label: 'Products', summary: 'What the network makes' },
  { href: '/services', label: 'Services', summary: 'Expertise you can hire' },
  { href: '/opportunities', label: 'Opportunities', summary: 'Demand looking for supply' },
  { href: '/about', label: 'About', summary: 'Why IBC exists' },
];

export const accountLinks = {
  join: { href: '/join', label: 'Join IBC' },
  login: { href: '/login', label: 'Log in' },
} as const;

export interface Pillar {
  slug: 'network' | 'businesses' | 'products' | 'services' | 'opportunities';
  title: string;
  headline: string;
  lede: string;
  focus: NodeKind;
  points: readonly { title: string; body: string }[];
}

export const pillars: readonly Pillar[] = [
  {
    slug: 'network',
    title: 'Network',
    headline: 'Your professional network, with the businesses attached.',
    lede: 'On IBC, people and the companies they work for live on the same map. Every connection carries context: who someone is, what their business does, and what it trades.',
    focus: 'person',
    points: [
      {
        title: 'Connect with people',
        body: 'Founders, buyers, engineers and advisors, with the companies they represent.',
      },
      {
        title: 'See how you are connected',
        body: 'Understand the path between you and the person or business you want to reach.',
      },
      {
        title: 'Keep relationships working',
        body: 'Conversations, introductions and deals stay with the relationship, not in scattered apps.',
      },
    ],
  },
  {
    slug: 'businesses',
    title: 'Businesses',
    headline: 'Find companies by what they actually do.',
    lede: 'Company pages on IBC describe capabilities, products, services and the people behind them, so buyers and partners can judge fit before the first message.',
    focus: 'company',
    points: [
      {
        title: 'A real business identity',
        body: 'Legal name, country, registration and verification status, in a format that works in any country.',
      },
      {
        title: 'Capabilities, not slogans',
        body: 'What a company makes, the services it offers and the markets it serves.',
      },
      {
        title: 'Teams you can reach',
        body: 'See who works there and connect with the right person directly.',
      },
    ],
  },
  {
    slug: 'products',
    title: 'Products',
    headline: 'Products, with the maker one step away.',
    lede: 'Every product on IBC belongs to a business and a person you can talk to. Discover what you need, compare suppliers and start a request for quotation from the same place.',
    focus: 'product',
    points: [
      {
        title: 'Discover by need',
        body: 'Search by what you are trying to buy, not by the exact name a seller used.',
      },
      {
        title: 'Compare suppliers',
        body: 'See specifications, origin and the supplier’s standing side by side.',
      },
      {
        title: 'Ask for a quote',
        body: 'Send a request for quotation to one supplier or several at once.',
      },
    ],
  },
  {
    slug: 'services',
    title: 'Services',
    headline: 'The expertise behind every deal.',
    lede: 'Logistics, inspection, finance, compliance, design. IBC connects businesses with the services that move trade forward, offered by firms and independent professionals.',
    focus: 'service',
    points: [
      {
        title: 'Find specialists',
        body: 'Service providers listed with the industries and regions they cover.',
      },
      {
        title: 'Check their record',
        body: 'Reviews and reputation come from completed work on the network.',
      },
      {
        title: 'Bring them into the deal',
        body: 'Add a forwarder, inspector or advisor to the conversation where the business is happening.',
      },
    ],
  },
  {
    slug: 'opportunities',
    title: 'Opportunities',
    headline: 'Demand, looking for the right supply.',
    lede: 'Open requests, distribution openings, partnerships and export orders. Opportunities on IBC reach the businesses able to fulfil them.',
    focus: 'opportunity',
    points: [
      {
        title: 'Post what you need',
        body: 'Describe the requirement once; IBC brings it to suitable businesses.',
      },
      {
        title: 'Respond with a quote',
        body: 'Suppliers answer with structured quotes buyers can compare.',
      },
      { title: 'Move to an order', body: 'Negotiate, agree and track the order through delivery.' },
    ],
  },
];

/** The transaction lifecycle, with an illustrative artifact for each step. */
export const tradeJourney = [
  {
    step: 'Request',
    detail: 'A buyer describes what they need and invites suppliers.',
    artifact: '5,000 aluminium enclosures, IP65, needed by March',
  },
  {
    step: 'Quote',
    detail: 'Suppliers respond with prices, terms and lead times.',
    artifact: { amount: '1840000', currency: 'INR', locale: 'en-IN', note: 'Lead time 6 weeks' },
  },
  {
    step: 'Compare',
    detail: 'Quotes line up side by side, with each supplier’s standing.',
    artifact: 'Three quotes, ranked by price, lead time and track record',
  },
  {
    step: 'Negotiate',
    detail: 'Terms are agreed in one thread, with a record of every change.',
    artifact: 'Advance payment changed from 30% to 20%',
  },
  {
    step: 'Order',
    detail: 'The agreed quote becomes an order both sides can see.',
    artifact: 'Order confirmed by both parties',
  },
  {
    step: 'Pay',
    detail: 'Payment in the currency the deal was agreed in.',
    artifact: { amount: '20150', currency: 'EUR', locale: 'de-DE', note: 'Paid in euros' },
  },
  {
    step: 'Deliver',
    detail: 'Shipment and receipt are confirmed on the order.',
    artifact: 'Delivered to Hamburg, receipt confirmed',
  },
] as const;

export const globalReach = [
  'Maharashtra',
  'India',
  'Asia',
  'Europe',
  'Americas',
  'The world',
] as const;
