/**
 * Product imagery. Until suppliers upload photographs, selected demo products use
 * illustrations rendered by the offline studio (scripts/render-studio); they are labelled
 * "Rendered illustration" wherever they appear.
 */
export interface ProductMedia {
  /** Path prefix; files exist as `${base}-800.webp` and `${base}-1600.webp` (4:3). */
  base: string;
  alt: string;
  kind: 'rendered-illustration';
}

const MEDIA: Record<string, ProductMedia> = {
  'isopropyl-alcohol-99-9': {
    base: '/products/drum',
    alt: 'Two navy steel drums with a blank label',
    kind: 'rendered-illustration',
  },
  'aluminium-ingot-a7': {
    base: '/products/ingots',
    alt: 'A cross-stacked bundle of aluminium ingots',
    kind: 'rendered-illustration',
  },
  'ev-motor-housing-a356': {
    base: '/products/housing',
    alt: 'A finned cast-aluminium motor housing with a machined flange',
    kind: 'rendered-illustration',
  },
  'organic-cotton-yarn-40s': {
    base: '/products/yarn',
    alt: 'Three cones of natural cotton yarn',
    kind: 'rendered-illustration',
  },
  'api-610-oh2-process-pump': {
    base: '/products/pump',
    alt: 'A centrifugal process pump and motor on a baseplate',
    kind: 'rendered-illustration',
  },
  'hdpe-film-grade': {
    base: '/products/pellets',
    alt: 'A heap of white polymer pellets beside a scoop',
    kind: 'rendered-illustration',
  },
};

export function productMedia(slug: string): ProductMedia | undefined {
  return MEDIA[slug];
}
