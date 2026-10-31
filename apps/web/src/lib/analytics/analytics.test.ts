import { describe, expect, it, vi } from 'vitest';
import { registerAnalyticsProvider, track, type AnalyticsEvent } from './index';

describe('analytics', () => {
  it('fans events out to every registered provider and unregisters cleanly', () => {
    const a = vi.fn<(event: AnalyticsEvent) => void>();
    const b = vi.fn<(event: AnalyticsEvent) => void>();
    const offA = registerAnalyticsProvider({ name: 'a', track: a });
    const offB = registerAnalyticsProvider({ name: 'b', track: b });
    track({ name: 'join_click', location: 'hero' });
    expect(a).toHaveBeenCalledWith({ name: 'join_click', location: 'hero' });
    expect(b).toHaveBeenCalledTimes(1);
    offA();
    track({ name: 'page_view', path: '/' });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
    offB();
  });

  it('isolates provider failures', () => {
    const good = vi.fn();
    const offBad = registerAnalyticsProvider({
      name: 'bad',
      track: () => {
        throw new Error('vendor down');
      },
    });
    const offGood = registerAnalyticsProvider({ name: 'good', track: good });
    expect(() => {
      track({ name: 'page_view', path: '/' });
    }).not.toThrow();
    expect(good).toHaveBeenCalled();
    offBad();
    offGood();
  });

  it('does not register the same provider twice', () => {
    const fn = vi.fn();
    const off = registerAnalyticsProvider({ name: 'once', track: fn });
    registerAnalyticsProvider({ name: 'once', track: fn });
    track({ name: 'page_view', path: '/' });
    expect(fn).toHaveBeenCalledTimes(1);
    off();
  });
});
