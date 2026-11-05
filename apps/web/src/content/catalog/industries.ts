import type { Industry } from './types';

/** Industry taxonomy. Data-driven: add an entry here and every discovery surface picks it up. */
export const industries: readonly Industry[] = [
  {
    slug: 'chemicals',
    name: 'Chemicals',
    icon: 'flask',
    summary: 'Specialty, bulk and fine chemicals, solvents and intermediates.',
    segments: ['Specialty chemicals', 'Solvents', 'Dyes and pigments', 'Industrial gases'],
  },
  {
    slug: 'pharmaceuticals',
    name: 'Pharmaceuticals',
    icon: 'capsule',
    summary: 'APIs, excipients, formulations and contract manufacturing.',
    segments: ['APIs', 'Excipients', 'Formulations', 'Contract manufacturing'],
  },
  {
    slug: 'petrochemicals',
    name: 'Petrochemicals',
    icon: 'drop',
    summary: 'Polymers, olefins, aromatics and base oils.',
    segments: ['Polymers', 'Olefins', 'Aromatics', 'Base oils'],
  },
  {
    slug: 'oil-and-gas',
    name: 'Oil and Gas',
    icon: 'rig',
    summary: 'Upstream equipment, pipeline services and refinery supply.',
    segments: ['Upstream equipment', 'Pipelines', 'Refinery services', 'LNG'],
  },
  {
    slug: 'engineering',
    name: 'Engineering',
    icon: 'gear',
    summary: 'Design, fabrication, precision machining and EPC services.',
    segments: ['Precision machining', 'Fabrication', 'EPC', 'Design services'],
  },
  {
    slug: 'manufacturing',
    name: 'Manufacturing',
    icon: 'factory',
    summary: 'Contract manufacturing, components and assemblies.',
    segments: ['Contract manufacturing', 'Plastics', 'Components', 'Packaging'],
  },
  {
    slug: 'metals-and-minerals',
    name: 'Metals and Minerals',
    icon: 'ingot',
    summary: 'Steel, non-ferrous metals, alloys and industrial minerals.',
    segments: ['Steel', 'Aluminium', 'Copper', 'Industrial minerals'],
  },
  {
    slug: 'automotive',
    name: 'Automotive',
    icon: 'car',
    summary: 'Auto components, castings, forgings and EV parts.',
    segments: ['Castings', 'Forgings', 'EV components', 'Aftermarket'],
  },
  {
    slug: 'construction',
    name: 'Construction',
    icon: 'crane',
    summary: 'Building materials, structural steel and site equipment.',
    segments: ['Cement', 'Structural steel', 'Site equipment', 'Interiors'],
  },
  {
    slug: 'energy',
    name: 'Energy',
    icon: 'bolt',
    summary: 'Solar, wind, storage, transmission and power equipment.',
    segments: ['Solar', 'Storage', 'Transmission', 'Power equipment'],
  },
  {
    slug: 'electronics',
    name: 'Electronics',
    icon: 'chip',
    summary: 'Components, PCBs, control systems and EMS.',
    segments: ['Components', 'PCB assembly', 'Controls', 'Sensors'],
  },
  {
    slug: 'textiles',
    name: 'Textiles',
    icon: 'spool',
    summary: 'Fibres, yarns, fabrics and technical textiles.',
    segments: ['Yarns', 'Fabrics', 'Technical textiles', 'Garments'],
  },
  {
    slug: 'agriculture',
    name: 'Agriculture',
    icon: 'leaf',
    summary: 'Agri commodities, inputs, processing and equipment.',
    segments: ['Commodities', 'Fertilisers', 'Food processing', 'Farm equipment'],
  },
  {
    slug: 'logistics',
    name: 'Logistics',
    icon: 'truck',
    summary: 'Freight forwarding, warehousing and customs services.',
    segments: ['Freight forwarding', 'Warehousing', 'Customs', 'Cold chain'],
  },
  {
    slug: 'industrial-equipment',
    name: 'Industrial Equipment',
    icon: 'valve',
    summary: 'Pumps, valves, compressors, motors and process equipment.',
    segments: ['Pumps', 'Valves', 'Compressors', 'Process equipment'],
  },
];

export function industryBySlug(slug: string): Industry | undefined {
  return industries.find((industry) => industry.slug === slug);
}
