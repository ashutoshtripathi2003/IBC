import { moneyFromDecimal, type Money } from '@ibc/kernel';

/**
 * Illustrative examples used in interface previews on the website. They are not real
 * members, companies or listings, and every preview that uses them says so.
 */
export interface ExamplePerson {
  name: string;
  initials: string;
  role: string;
  company: string;
  location: string;
  tags: readonly string[];
}

export interface ExampleCompany {
  name: string;
  sector: string;
  location: string;
  verified: boolean;
  capabilities: readonly string[];
  established: number;
}

export interface ExampleProduct {
  name: string;
  maker: string;
  origin: string;
  minimumOrder: string;
  price: Money;
  priceUnit: string;
  locale: string;
}

export const examplePerson: ExamplePerson = {
  name: 'Ananya Kulkarni',
  initials: 'AK',
  role: 'Sourcing lead',
  company: 'Sahyadri Agro Exports',
  location: 'Pune, India',
  tags: ['Agri commodities', 'Export compliance'],
};

export const examplePartner: ExamplePerson = {
  name: 'Lena Vogt',
  initials: 'LV',
  role: 'Head of procurement',
  company: 'Nordhafen Foods',
  location: 'Hamburg, Germany',
  tags: ['Food ingredients', 'EU import'],
};

export const exampleCompany: ExampleCompany = {
  name: 'Deccan Precision Castings',
  sector: 'Industrial manufacturing',
  location: 'Kolhapur, India',
  verified: true,
  capabilities: ['Aluminium die casting', 'CNC machining', 'Export packaging'],
  established: 1998,
};

export const exampleProduct: ExampleProduct = {
  name: 'Organic cotton yarn, 40s count',
  maker: 'Varhad Spinning Mills',
  origin: 'Akola, India',
  minimumOrder: '500 kg',
  price: moneyFromDecimal('312.50', 'INR'),
  priceUnit: 'per kg',
  locale: 'en-IN',
};

export const exampleSearch = 'organic cotton yarn suppliers in Maharashtra';
