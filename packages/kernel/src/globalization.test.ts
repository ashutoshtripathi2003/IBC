import { describe, expect, it } from 'vitest';
import {
  canonicalLocale,
  currencyMinorUnits,
  isCountryCode,
  isCurrencyCode,
  isTimeZone,
} from './globalization.js';

describe('globalization', () => {
  it('validates ISO 3166-1 alpha-2 country codes', () => {
    for (const code of ['IN', 'US', 'AE', 'DE', 'SG']) expect(isCountryCode(code)).toBe(true);
    for (const code of ['in', 'IND', 'ZZ', 'EU', 'QO', '', 'X1'])
      expect(isCountryCode(code)).toBe(false);
  });

  it('rejects deprecated and exceptionally reserved codes so a country has one code', () => {
    for (const code of ['UK', 'SU', 'YU', 'ZR', 'AN', 'DD', 'TP', 'AC', 'IC', 'EA']) {
      expect(isCountryCode(code)).toBe(false);
    }
    expect(isCountryCode('GB')).toBe(true);
    expect(isCountryCode('XK')).toBe(true);
  });

  it('accepts exactly the 249 ISO 3166-1 assigned codes plus XK', () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let count = 0;
    for (const a of letters) for (const b of letters) if (isCountryCode(a + b)) count += 1;
    expect(count).toBe(250);
  });

  it('validates ISO 4217 currency codes', () => {
    for (const code of ['INR', 'USD', 'EUR', 'JPY', 'AED']) expect(isCurrencyCode(code)).toBe(true);
    for (const code of ['inr', 'RS', 'QQQ', '']) expect(isCurrencyCode(code)).toBe(false);
  });

  it('validates IANA timezones', () => {
    for (const tz of ['UTC', 'Asia/Kolkata', 'America/New_York', 'Europe/London']) {
      expect(isTimeZone(tz)).toBe(true);
    }
    for (const tz of ['Mars/Olympus', '', 'IST+5']) expect(isTimeZone(tz)).toBe(false);
  });

  it('canonicalizes BCP 47 locales', () => {
    expect(canonicalLocale('en-in')).toBe('en-IN');
    expect(canonicalLocale('mr')).toBe('mr');
    expect(canonicalLocale('not a locale')).toBeNull();
  });

  it('knows currency minor units', () => {
    expect(currencyMinorUnits('INR')).toBe(2);
    expect(currencyMinorUnits('JPY')).toBe(0);
    expect(currencyMinorUnits('BHD')).toBe(3);
    expect(() => currencyMinorUnits('QQQ')).toThrow(RangeError);
  });
});
