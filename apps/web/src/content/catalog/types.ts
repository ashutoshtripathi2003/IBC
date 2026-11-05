import type { Money } from '@ibc/kernel';

/**
 * Catalogue types shared by discovery, search and profiles. Shapes mirror the planned API
 * resources so demonstration data can be replaced by API responses without UI changes.
 * People and companies are separate entities; one person can hold several roles.
 */
export type IndustryIcon =
  | 'flask'
  | 'capsule'
  | 'drop'
  | 'rig'
  | 'gear'
  | 'factory'
  | 'ingot'
  | 'car'
  | 'crane'
  | 'bolt'
  | 'chip'
  | 'spool'
  | 'leaf'
  | 'truck'
  | 'valve';

export interface Industry {
  slug: string;
  name: string;
  icon: IndustryIcon;
  summary: string;
  segments: readonly string[];
}

export type BusinessType =
  'Manufacturer' | 'Supplier' | 'Distributor' | 'Exporter' | 'Service provider';

export interface Location {
  city: string;
  region?: string;
  /** ISO 3166-1 alpha-2 */
  country: string;
}

export interface Company {
  slug: string;
  name: string;
  industries: readonly string[];
  types: readonly BusinessType[];
  location: Location;
  founded: number;
  employees: string;
  summary: string;
  about: string;
  capabilities: readonly string[];
  /** Only true when IBC has verified the business. Demonstration records are never verified. */
  verified: boolean;
  /** True for fictional demonstration records; real member data is false. */
  demo: boolean;
}

export interface Product {
  slug: string;
  name: string;
  industry: string;
  category: string;
  companySlug: string;
  summary: string;
  specs: readonly { label: string; value: string }[];
  /** null means price on request. */
  price: { amount: Money; unit: string } | null;
  minimumOrder: string | null;
  availability: string | null;
  shipsFrom: Location;
  /** True for fictional demonstration records; real member data is false. */
  demo: boolean;
}

export interface Role {
  title: string;
  companySlug?: string;
  organisation?: string;
  current: boolean;
}

export interface Person {
  slug: string;
  name: string;
  headline: string;
  roles: readonly Role[];
  location: Location;
  industries: readonly string[];
  expertise: readonly string[];
  interests: readonly string[];
  about: string;
  /** True for fictional demonstration records; real member data is false. */
  demo: boolean;
}

export interface Service {
  slug: string;
  name: string;
  industry: string;
  companySlug: string;
  summary: string;
  coverage: readonly string[];
  /** True for fictional demonstration records; real member data is false. */
  demo: boolean;
}

export interface Opportunity {
  slug: string;
  title: string;
  kind: 'Request for quotation' | 'Distributor wanted' | 'Partnership' | 'Export enquiry';
  industry: string;
  postedBy: string;
  location: Location;
  summary: string;
  quantity: string | null;
  deadline: string | null;
  /** True for fictional demonstration records; real member data is false. */
  demo: boolean;
}
