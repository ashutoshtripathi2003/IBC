import { isCountryCode } from '@ibc/kernel';

let cached: { code: string; name: string }[] | null = null;

/** Every current ISO 3166-1 country (the same list the API accepts), named in English. */
export function countryOptions(): { code: string; name: string }[] {
  if (cached) return cached;
  const names = new Intl.DisplayNames(['en'], { type: 'region' });
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const list: { code: string; name: string }[] = [];
  for (const a of letters) {
    for (const b of letters) {
      const code = a + b;
      if (isCountryCode(code)) list.push({ code, name: names.of(code) ?? code });
    }
  }
  cached = list.sort((x, y) => x.name.localeCompare(y.name));
  return cached;
}
