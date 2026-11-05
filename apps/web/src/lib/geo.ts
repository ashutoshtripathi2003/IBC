import type { Location } from '@/content/catalog';

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

export function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export function formatLocation(location: Location): string {
  return [location.city, location.region, countryName(location.country)].filter(Boolean).join(', ');
}
