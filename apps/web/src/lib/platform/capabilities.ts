import { isCountryCode, isTimeZone } from '@ibc/kernel';

/**
 * Real, verifiable numbers about what the platform supports, computed from the same
 * validation the IBC API uses (shared @ibc/kernel). No marketing estimates.
 */
export function platformCapabilities() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let countries = 0;
  for (const a of letters) for (const b of letters) if (isCountryCode(a + b)) countries += 1;
  const timeZones = Intl.supportedValuesOf('timeZone').filter(isTimeZone).length;
  const currencies = Intl.supportedValuesOf('currency').length;
  return { countries, timeZones, currencies };
}
