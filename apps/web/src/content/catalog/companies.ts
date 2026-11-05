import type { Company } from './types';

/**
 * DEMONSTRATION DATA. Fictional companies used to show how IBC works before real members
 * join. They are labelled as demonstrations wherever they appear and are never verified.
 */
export const companies: readonly Company[] = [
  {
    slug: 'sahyadri-specialty-chemicals',
    name: 'Sahyadri Specialty Chemicals',
    industries: ['chemicals', 'pharmaceuticals'],
    types: ['Manufacturer', 'Exporter'],
    location: { city: 'Pune', region: 'Maharashtra', country: 'IN' },
    founded: 2003,
    employees: '200–500',
    summary:
      'Manufacturer of specialty solvents and pharmaceutical intermediates for regulated markets.',
    about:
      'Sahyadri Specialty Chemicals produces high-purity solvents and pharmaceutical intermediates in batch and continuous plants. The company supplies formulators and API manufacturers across Asia and Europe, with in-house analytical labs and documented quality systems.',
    capabilities: [
      'High-purity solvents',
      'Pharma intermediates',
      'Custom synthesis',
      'Drum and IBC packing',
    ],
    verified: false,
    demo: true,
  },
  {
    slug: 'deccan-precision-castings',
    name: 'Deccan Precision Castings',
    industries: ['automotive', 'engineering'],
    types: ['Manufacturer'],
    location: { city: 'Kolhapur', region: 'Maharashtra', country: 'IN' },
    founded: 1998,
    employees: '500–1,000',
    summary:
      'Aluminium die castings and CNC-machined components for automotive and industrial OEMs.',
    about:
      'Deccan Precision Castings runs high-pressure die casting cells from 250 to 1,600 tonnes with in-line CNC machining. It supplies housings, brackets and EV motor components to OEMs and Tier 1 suppliers.',
    capabilities: [
      'Aluminium die casting',
      'CNC machining',
      'Powder coating',
      'PPAP documentation',
    ],
    verified: false,
    demo: true,
  },
  {
    slug: 'gulf-polymer-trading',
    name: 'Gulf Polymer Trading',
    industries: ['petrochemicals'],
    types: ['Distributor', 'Supplier'],
    location: { city: 'Dubai', country: 'AE' },
    founded: 2011,
    employees: '50–200',
    summary: 'Regional distributor of polyethylene, polypropylene and engineering polymers.',
    about:
      'Gulf Polymer Trading holds stock of commodity and engineering polymers in Jebel Ali and serves converters across the Middle East, East Africa and South Asia with flexible lot sizes.',
    capabilities: [
      'PE and PP grades',
      'Engineering polymers',
      'Bonded warehousing',
      'Regional delivery',
    ],
    verified: false,
    demo: true,
  },
  {
    slug: 'rheinwerk-pumpen',
    name: 'Rheinwerk Pumpen',
    industries: ['industrial-equipment', 'oil-and-gas'],
    types: ['Manufacturer'],
    location: { city: 'Duisburg', country: 'DE' },
    founded: 1962,
    employees: '1,000+',
    summary: 'Centrifugal and process pumps for chemical, oil and gas and water applications.',
    about:
      'Rheinwerk Pumpen designs and builds API 610 and ISO 5199 centrifugal pumps, with service centres across Europe and partner workshops in the Middle East and India.',
    capabilities: ['API 610 pumps', 'ISO 5199 pumps', 'Spares and service', 'Performance testing'],
    verified: false,
    demo: true,
  },
  {
    slug: 'varhad-spinning-mills',
    name: 'Varhad Spinning Mills',
    industries: ['textiles'],
    types: ['Manufacturer', 'Exporter'],
    location: { city: 'Akola', region: 'Maharashtra', country: 'IN' },
    founded: 2004,
    employees: '500–1,000',
    summary: 'Organic and conventional cotton yarns from 20s to 60s count.',
    about:
      'Varhad Spinning Mills sources cotton from Vidarbha farmer groups and spins combed and carded yarns for knitting and weaving mills in Asia and Europe.',
    capabilities: ['Organic cotton yarn', 'Combed yarn', 'Compact spinning', 'Export logistics'],
    verified: false,
    demo: true,
  },
  {
    slug: 'mekong-electronics-assembly',
    name: 'Mekong Electronics Assembly',
    industries: ['electronics', 'manufacturing'],
    types: ['Manufacturer', 'Service provider'],
    location: { city: 'Ho Chi Minh City', country: 'VN' },
    founded: 2014,
    employees: '200–500',
    summary: 'PCB assembly and box-build for industrial controls and IoT devices.',
    about:
      'Mekong Electronics Assembly offers SMT and through-hole assembly, functional testing and box-build for industrial control and connected-device companies.',
    capabilities: ['SMT assembly', 'Box build', 'Functional testing', 'Conformal coating'],
    verified: false,
    demo: true,
  },
  {
    slug: 'konkan-steel-structures',
    name: 'Konkan Steel Structures',
    industries: ['construction', 'metals-and-minerals'],
    types: ['Manufacturer', 'Supplier'],
    location: { city: 'Raigad', region: 'Maharashtra', country: 'IN' },
    founded: 2008,
    employees: '200–500',
    summary: 'Pre-engineered buildings and structural steel fabrication for industrial projects.',
    about:
      'Konkan Steel Structures designs, fabricates and erects pre-engineered buildings, pipe racks and structural steel for factories, warehouses and process plants.',
    capabilities: [
      'Pre-engineered buildings',
      'Structural fabrication',
      'Galvanising',
      'Site erection',
    ],
    verified: false,
    demo: true,
  },
  {
    slug: 'helios-solar-components',
    name: 'Helios Solar Components',
    industries: ['energy', 'electronics'],
    types: ['Manufacturer', 'Exporter'],
    location: { city: 'Ahmedabad', region: 'Gujarat', country: 'IN' },
    founded: 2016,
    employees: '200–500',
    summary: 'Solar module mounting structures, junction boxes and balance-of-system parts.',
    about:
      'Helios Solar Components manufactures mounting structures and balance-of-system components for utility-scale and rooftop solar installers.',
    capabilities: [
      'Mounting structures',
      'Junction boxes',
      'Cable harnesses',
      'Hot-dip galvanising',
    ],
    verified: false,
    demo: true,
  },
  {
    slug: 'nordhafen-forwarding',
    name: 'Nordhafen Forwarding',
    industries: ['logistics'],
    types: ['Service provider'],
    location: { city: 'Hamburg', country: 'DE' },
    founded: 1994,
    employees: '200–500',
    summary: 'Ocean and air freight forwarding between Europe, India and the Gulf.',
    about:
      'Nordhafen Forwarding manages FCL, LCL and project cargo with customs brokerage in Hamburg, Rotterdam, Nhava Sheva and Jebel Ali.',
    capabilities: ['FCL and LCL', 'Project cargo', 'Customs brokerage', 'Dangerous goods'],
    verified: false,
    demo: true,
  },
  {
    slug: 'cerrado-agri-commodities',
    name: 'Cerrado Agri Commodities',
    industries: ['agriculture'],
    types: ['Supplier', 'Exporter'],
    location: { city: 'Goiânia', country: 'BR' },
    founded: 2009,
    employees: '50–200',
    summary: 'Exporter of soybean meal, maize and pulses to Asia and the Middle East.',
    about:
      'Cerrado Agri Commodities aggregates grain from growers in central Brazil and ships bulk and containerised cargo with third-party inspection.',
    capabilities: ['Soybean meal', 'Maize', 'Pulses', 'Third-party inspection'],
    verified: false,
    demo: true,
  },
  {
    slug: 'vidarbha-alloys',
    name: 'Vidarbha Alloys',
    industries: ['metals-and-minerals', 'manufacturing'],
    types: ['Manufacturer', 'Supplier'],
    location: { city: 'Nagpur', region: 'Maharashtra', country: 'IN' },
    founded: 2001,
    employees: '200–500',
    summary: 'Ferro alloys, aluminium ingots and master alloys for foundries.',
    about:
      'Vidarbha Alloys produces ferro alloys and aluminium master alloys for steel plants and non-ferrous foundries, with chemistry certificates on every lot.',
    capabilities: ['Ferro alloys', 'Aluminium ingots', 'Master alloys', 'Lot certification'],
    verified: false,
    demo: true,
  },
  {
    slug: 'atlas-process-engineering',
    name: 'Atlas Process Engineering',
    industries: ['engineering', 'chemicals', 'oil-and-gas'],
    types: ['Service provider'],
    location: { city: 'Houston', region: 'Texas', country: 'US' },
    founded: 1987,
    employees: '500–1,000',
    summary: 'Process design, detailed engineering and commissioning for chemical plants.',
    about:
      'Atlas Process Engineering delivers front-end and detailed engineering, procurement support and commissioning for chemical, refining and gas processing projects.',
    capabilities: ['FEED', 'Detailed engineering', 'Commissioning', 'HAZOP facilitation'],
    verified: false,
    demo: true,
  },
];

export function companyBySlug(slug: string): Company | undefined {
  return companies.find((company) => company.slug === slug);
}
