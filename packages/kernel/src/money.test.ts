import { describe, expect, it } from 'vitest';
import {
  addMoney,
  formatMoney,
  money,
  moneyFromDecimal,
  moneyToDecimal,
  subtractMoney,
} from './money.js';

describe('money', () => {
  it('round-trips decimal strings using currency minor units', () => {
    expect(moneyFromDecimal('1234.5', 'INR')).toEqual({ amountMinor: 123450n, currency: 'INR' });
    expect(moneyToDecimal(moneyFromDecimal('1234.5', 'INR'))).toBe('1234.50');
    expect(moneyToDecimal(moneyFromDecimal('500', 'JPY'))).toBe('500');
    expect(moneyToDecimal(moneyFromDecimal('1.234', 'BHD'))).toBe('1.234');
    expect(moneyToDecimal(moneyFromDecimal('-0.05', 'USD'))).toBe('-0.05');
  });

  it('handles amounts beyond float precision', () => {
    const big = moneyFromDecimal('92233720368547758.07', 'USD');
    expect(big.amountMinor).toBe(9223372036854775807n);
    expect(moneyToDecimal(big)).toBe('92233720368547758.07');
  });

  it('rejects precision the currency does not support instead of rounding', () => {
    expect(() => moneyFromDecimal('1.001', 'INR')).toThrow(RangeError);
    expect(() => moneyFromDecimal('1.5', 'JPY')).toThrow(RangeError);
    expect(() => moneyFromDecimal('abc', 'USD')).toThrow(RangeError);
  });

  it('refuses arithmetic across currencies', () => {
    expect(addMoney(money(100n, 'INR'), money(50n, 'INR')).amountMinor).toBe(150n);
    expect(subtractMoney(money(100n, 'INR'), money(150n, 'INR')).amountMinor).toBe(-50n);
    expect(() => addMoney(money(1n, 'INR'), money(1n, 'USD'))).toThrow(/Currency mismatch/);
  });

  it('formats per locale', () => {
    expect(formatMoney(moneyFromDecimal('1234567.5', 'INR'), 'en-IN')).toBe('₹12,34,567.50');
    expect(formatMoney(moneyFromDecimal('1234567.5', 'USD'), 'en-US')).toBe('$1,234,567.50');
  });
});
