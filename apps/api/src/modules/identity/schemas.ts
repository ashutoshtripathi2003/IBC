import { canonicalLocale, isCountryCode, isTimeZone } from '@ibc/kernel';
import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .max(254)
  .pipe(z.email({ message: 'Must be a valid email address' }))
  .meta({ format: 'email', example: 'priya@example.com' });

/**
 * NIST SP 800-63B: length over composition rules. Upper bound prevents
 * hash-cost abuse with huge inputs.
 */
export const passwordSchema = z
  .string()
  .min(12, 'Must be at least 12 characters')
  .max(128, 'Must be at most 128 characters')
  .meta({ format: 'password' });

export const displayNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine((value) => !/\p{Cc}/u.test(value), 'Must not contain control characters');

export const localeSchema = z.string().transform((value, ctx) => {
  const canonical = canonicalLocale(value);
  if (!canonical) {
    ctx.addIssue({ code: 'custom', message: 'Must be a valid BCP 47 language tag' });
    return z.NEVER;
  }
  return canonical;
});

export const timezoneSchema = z
  .string()
  .refine(isTimeZone, 'Must be a valid IANA timezone, e.g. Asia/Kolkata')
  .meta({ description: 'IANA timezone name.', example: 'Asia/Kolkata' });

export const countryCodeSchema = z
  .string()
  .transform((value) => value.toUpperCase())
  .refine(isCountryCode, 'Must be an ISO 3166-1 alpha-2 country code')
  .meta({
    description: 'ISO 3166-1 alpha-2 country code; upper-cased.',
    pattern: '^[A-Za-z]{2}$',
    example: 'IN',
  });

export const registerSchema = z.strictObject({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
  locale: localeSchema.optional(),
  timezone: timezoneSchema.optional(),
  countryCode: countryCodeSchema.optional(),
});

export const loginSchema = z.strictObject({
  email: emailSchema,
  // Only bound the length on login; policy may have changed since registration.
  password: z.string().min(1).max(128),
});

export const updateProfileSchema = z
  .strictObject({
    displayName: displayNameSchema.optional(),
    locale: localeSchema.optional(),
    timezone: timezoneSchema.optional(),
    countryCode: countryCodeSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export const sessionIdParamsSchema = z.strictObject({ sessionId: z.uuid() });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

const oneTimeTokenSchema = z
  .string()
  .min(10)
  .max(100)
  .meta({ description: 'Token from the emailed link (URL fragment after #token=).' });

export const confirmEmailVerificationSchema = z.strictObject({ token: oneTimeTokenSchema });

export const requestPasswordResetSchema = z.strictObject({ email: emailSchema });

export const confirmPasswordResetSchema = z.strictObject({
  token: oneTimeTokenSchema,
  newPassword: passwordSchema,
});

// ---------------------------------------------------------------------------
// Response contracts. Route handlers are typed against these, and the contract
// test validates real responses with them, so the published OpenAPI cannot drift.

const timestamp = z.iso.datetime().meta({ example: '2026-10-31T09:30:00.000Z' });

export const userResponseSchema = z
  .object({
    id: z.uuid(),
    email: z.string().meta({ format: 'email' }),
    emailVerified: z.boolean(),
    displayName: z.string(),
    status: z.enum(['active', 'suspended', 'deactivated']),
    locale: z.string().meta({ example: 'en-IN' }),
    timezone: z.string().meta({ example: 'Asia/Kolkata' }),
    countryCode: z.string().length(2).nullable().meta({ example: 'IN' }),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .meta({ id: 'User' });

export const issuedSessionSchema = z
  .object({
    id: z.uuid(),
    token: z.string().meta({ description: 'Bearer token. Shown once; store securely.' }),
    expiresAt: timestamp,
  })
  .meta({ id: 'IssuedSession' });

export const authResponseSchema = z
  .object({ user: userResponseSchema, session: issuedSessionSchema })
  .meta({ id: 'AuthResult' });

export const userEnvelopeSchema = z.object({ user: userResponseSchema });

export const sessionListResponseSchema = z.object({
  sessions: z.array(
    z
      .object({
        id: z.uuid(),
        current: z.boolean().meta({ description: 'True for the session making this request.' }),
        createdAt: timestamp,
        lastSeenAt: timestamp,
        expiresAt: timestamp,
        ip: z.string().nullable(),
        userAgent: z.string().nullable(),
      })
      .meta({ id: 'Session' }),
  ),
});

export type UserResponse = z.infer<typeof userResponseSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type SessionListResponse = z.infer<typeof sessionListResponseSchema>;
