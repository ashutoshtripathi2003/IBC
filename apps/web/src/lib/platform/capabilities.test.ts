import { describe, expect, it } from 'vitest';
import { platformCapabilities } from './capabilities';

describe('platform capabilities', () => {
  it('reports plausible real counts from the shared validation', () => {
    const { countries, timeZones, currencies } = platformCapabilities();
    expect(countries).toBeGreaterThan(200);
    expect(countries).toBe(250);
    expect(timeZones).toBeGreaterThan(300);
    expect(currencies).toBeGreaterThan(100);
  });
});
