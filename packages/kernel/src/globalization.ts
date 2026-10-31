/**
 * Globalization primitives. IBC is global-first: nothing here assumes a single
 * country, currency, language or timezone. Validation relies on the ICU data
 * shipped with Node.js (full-icu is the default since Node 13).
 */

const regionNames = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' });
const currencyNames = new Intl.DisplayNames(['en'], { type: 'currency', fallback: 'none' });

// ISO 3166-1 user-assigned ranges and non-country groupings ICU still names.
// XK (Kosovo) is user-assigned but in universal practical use, so it is allowed.
const NON_COUNTRY_REGION = /^(AA|Q[M-Z]|X[A-JL-Z]|ZZ|EU|EZ|UN)$/;

/** ISO 3166-1 alpha-2 country code, e.g. "IN", "US", "AE". */
export function isCountryCode(value: string): boolean {
  if (!/^[A-Z]{2}$/.test(value) || NON_COUNTRY_REGION.test(value)) return false;
  return regionNames.of(value) !== undefined;
}

/** ISO 4217 alphabetic currency code, e.g. "INR", "USD", "EUR". */
export function isCurrencyCode(value: string): boolean {
  if (!/^[A-Z]{3}$/.test(value)) return false;
  return currencyNames.of(value) !== undefined;
}

/** IANA timezone identifier, e.g. "Asia/Kolkata", "UTC". */
export function isTimeZone(value: string): boolean {
  if (value.length === 0 || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** Returns the canonical BCP 47 form of a language tag, or null if invalid. */
export function canonicalLocale(value: string): string | null {
  if (value.length === 0 || value.length > 35) return null;
  try {
    const [canonical] = Intl.getCanonicalLocales(value);
    return canonical ?? null;
  } catch {
    return null;
  }
}

/** Number of minor-unit digits for a currency (INR 2, JPY 0, BHD 3). */
export function currencyMinorUnits(currency: string): number {
  if (!isCurrencyCode(currency)) {
    throw new RangeError(`Unknown currency code: ${currency}`);
  }
  return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
    .maximumFractionDigits as number;
}
