import { describe, expect, it } from 'vitest';
import { safeNext, tokenFromFragment } from './client';

describe('account client helpers', () => {
  it('allows only same-site paths after sign-in', () => {
    expect(safeNext('/app/settings')).toBe('/app/settings');
    expect(safeNext('/products?q=pump')).toBe('/products?q=pump');
    for (const bad of [
      null,
      '',
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      'javascript:alert(1)',
      '/\u0000x',
    ]) {
      expect(safeNext(bad)).toBe('/app');
    }
  });

  it('reads one-time tokens from the fragment only when well-formed', () => {
    expect(tokenFromFragment('#token=ibc_ev_abcDEF123_-xyz')).toBe('ibc_ev_abcDEF123_-xyz');
    expect(tokenFromFragment('#token=<script>')).toBeNull();
    expect(tokenFromFragment('')).toBeNull();
  });
});
