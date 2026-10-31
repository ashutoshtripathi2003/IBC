import { currencyMinorUnits, isCurrencyCode } from './globalization.js';

/**
 * Money is always an integer amount of the currency's minor unit plus an
 * ISO 4217 currency code. Floating point is never used for monetary values.
 * Persist as `amount_minor bigint` + `currency char(3)`.
 */
export interface Money {
  readonly amountMinor: bigint;
  readonly currency: string;
}

export function money(amountMinor: bigint, currency: string): Money {
  if (!isCurrencyCode(currency)) {
    throw new RangeError(`Unknown currency code: ${currency}`);
  }
  return Object.freeze({ amountMinor, currency });
}

/**
 * Parses a decimal string ("1234.50") into Money. Rejects more fractional
 * digits than the currency allows rather than silently rounding.
 */
export function moneyFromDecimal(decimal: string, currency: string): Money {
  const digits = currencyMinorUnits(currency);
  const match = /^(-)?(\d+)(?:\.(\d+))?$/.exec(decimal.trim());
  if (!match) throw new RangeError(`Invalid decimal amount: ${decimal}`);
  const [, sign, whole, fraction = ''] = match;
  if (fraction.length > digits) {
    throw new RangeError(`${currency} allows at most ${digits} fractional digits`);
  }
  const minor = BigInt(whole! + fraction.padEnd(digits, '0'));
  return money(sign ? -minor : minor, currency);
}

export function moneyToDecimal(value: Money): string {
  const digits = currencyMinorUnits(value.currency);
  const negative = value.amountMinor < 0n;
  const abs = (negative ? -value.amountMinor : value.amountMinor)
    .toString()
    .padStart(digits + 1, '0');
  const whole = digits === 0 ? abs : abs.slice(0, -digits);
  const fraction = digits === 0 ? '' : `.${abs.slice(-digits)}`;
  return `${negative ? '-' : ''}${whole}${fraction}`;
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new RangeError(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinor + b.amountMinor, a.currency);
}

export function subtractMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinor - b.amountMinor, a.currency);
}

export function formatMoney(value: Money, locale: string): string {
  const digits = currencyMinorUnits(value.currency);
  // Intl accepts decimal strings, which avoids float precision loss for large amounts.
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: value.currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(moneyToDecimal(value) as unknown as number);
}
