import type { Person } from './types';

/** DEMONSTRATION DATA. Fictional professionals; a person can hold roles at several companies. */
export const people: readonly Person[] = [
  {
    slug: 'ananya-kulkarni',
    name: 'Ananya Kulkarni',
    headline: 'Head of sourcing, specialty chemicals',
    roles: [
      { title: 'Head of sourcing', companySlug: 'sahyadri-specialty-chemicals', current: true },
      {
        title: 'Advisor, export compliance',
        organisation: 'Maharashtra exporters forum (demo)',
        current: true,
      },
    ],
    location: { city: 'Pune', region: 'Maharashtra', country: 'IN' },
    industries: ['chemicals', 'pharmaceuticals'],
    expertise: ['Raw material sourcing', 'REACH and export compliance', 'Supplier audits'],
    interests: ['Solvent recovery', 'European distributors'],
    about:
      'Fifteen years in chemical procurement, building supplier programmes for regulated pharmaceutical customers.',
    demo: true,
  },
  {
    slug: 'rohan-deshmukh',
    name: 'Rohan Deshmukh',
    headline: 'Export manager, cotton yarns',
    roles: [{ title: 'Export manager', companySlug: 'varhad-spinning-mills', current: true }],
    location: { city: 'Akola', region: 'Maharashtra', country: 'IN' },
    industries: ['textiles'],
    expertise: ['Yarn exports', 'Letters of credit', 'Buyer development'],
    interests: ['Knitting mills in Europe', 'Organic supply chains'],
    about:
      'Leads export sales for organic and combed yarns across Bangladesh, Turkey and Portugal.',
    demo: true,
  },
  {
    slug: 'lena-vogt',
    name: 'Lena Vogt',
    headline: 'Procurement director, industrial pumps',
    roles: [{ title: 'Procurement director', companySlug: 'rheinwerk-pumpen', current: true }],
    location: { city: 'Duisburg', country: 'DE' },
    industries: ['industrial-equipment', 'metals-and-minerals'],
    expertise: ['Castings procurement', 'Supplier development', 'Should-cost analysis'],
    interests: ['Indian foundries', 'Duplex stainless castings'],
    about: 'Builds global supply bases for cast and machined pump components.',
    demo: true,
  },
  {
    slug: 'omar-haddad',
    name: 'Omar Haddad',
    headline: 'Commercial manager, polymers',
    roles: [{ title: 'Commercial manager', companySlug: 'gulf-polymer-trading', current: true }],
    location: { city: 'Dubai', country: 'AE' },
    industries: ['petrochemicals'],
    expertise: ['Polymer distribution', 'Market pricing', 'Credit management'],
    interests: ['Converters in East Africa', 'Recycled polymers'],
    about: 'Manages polymer sales to converters across the Gulf, East Africa and South Asia.',
    demo: true,
  },
  {
    slug: 'priya-iyer',
    name: 'Priya Iyer',
    headline: 'Quality and PPAP lead, die castings',
    roles: [
      { title: 'Quality lead', companySlug: 'deccan-precision-castings', current: true },
      { title: 'Visiting faculty', organisation: 'Engineering college (demo)', current: true },
    ],
    location: { city: 'Kolhapur', region: 'Maharashtra', country: 'IN' },
    industries: ['automotive', 'engineering'],
    expertise: ['PPAP', 'IATF 16949', 'Casting porosity analysis'],
    interests: ['EV components', 'Supplier quality'],
    about: 'Runs customer quality and launch documentation for automotive die-cast programmes.',
    demo: true,
  },
  {
    slug: 'thanh-nguyen',
    name: 'Thanh Nguyen',
    headline: 'Business development, electronics manufacturing',
    roles: [
      {
        title: 'Business development lead',
        companySlug: 'mekong-electronics-assembly',
        current: true,
      },
    ],
    location: { city: 'Ho Chi Minh City', country: 'VN' },
    industries: ['electronics', 'manufacturing'],
    expertise: ['EMS partnerships', 'NPI', 'Cost engineering'],
    interests: ['Industrial IoT', 'Indian OEMs'],
    about: 'Helps OEMs move industrial electronics from prototype to volume production.',
    demo: true,
  },
  {
    slug: 'daniel-reyes',
    name: 'Daniel Reyes',
    headline: 'Principal process engineer',
    roles: [
      {
        title: 'Principal process engineer',
        companySlug: 'atlas-process-engineering',
        current: true,
      },
    ],
    location: { city: 'Houston', region: 'Texas', country: 'US' },
    industries: ['engineering', 'chemicals', 'oil-and-gas'],
    expertise: ['Process design', 'HAZOP', 'Debottlenecking'],
    interests: ['Solvent plants', 'Projects in India'],
    about: 'Leads FEED and debottlenecking studies for chemical and gas processing plants.',
    demo: true,
  },
  {
    slug: 'sneha-patil',
    name: 'Sneha Patil',
    headline: 'Founder, logistics advisory',
    roles: [
      { title: 'Founder', organisation: 'Independent logistics advisory (demo)', current: true },
      { title: 'Former operations head', companySlug: 'nordhafen-forwarding', current: false },
    ],
    location: { city: 'Mumbai', region: 'Maharashtra', country: 'IN' },
    industries: ['logistics'],
    expertise: ['Export documentation', 'Dangerous goods', 'Freight procurement'],
    interests: ['Exporters in Maharashtra', 'Gulf trade lanes'],
    about: 'Advises manufacturers on export logistics, documentation and freight contracts.',
    demo: true,
  },
];

export function personBySlug(slug: string): Person | undefined {
  return people.find((person) => person.slug === slug);
}
