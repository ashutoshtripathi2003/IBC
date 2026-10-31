/**
 * Events published by the identity module. Payloads deliberately exclude
 * credentials and contact PII (email); consumers that need contact data must
 * request it from identity through an authorized API.
 */
export const IdentityEvents = {
  UserCreated: { type: 'identity.user.created', version: 1 },
  UserProfileUpdated: { type: 'identity.user.profile_updated', version: 1 },
  UserEmailVerified: { type: 'identity.user.email_verified', version: 1 },
} as const;

export interface UserCreatedV1 extends Record<string, unknown> {
  userId: string;
  displayName: string;
  locale: string;
  timezone: string;
  countryCode: string | null;
}

export interface UserProfileUpdatedV1 extends Record<string, unknown> {
  userId: string;
  changedFields: string[];
  displayName: string;
  locale: string;
  timezone: string;
  countryCode: string | null;
}

export interface UserEmailVerifiedV1 extends Record<string, unknown> {
  userId: string;
}
