import { canonicalLocale, isCountryCode, isTimeZone } from '@ibc/kernel';
import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .max(254)
  .pipe(z.email({ message: 'Must be a valid email address' }));

/**
 * NIST SP 800-63B: length over composition rules. Upper bound prevents
 * hash-cost abuse with huge inputs.
 */
export const passwordSchema = z
  .string()
  .min(12, 'Must be at least 12 characters')
  .max(128, 'Must be at most 128 characters');

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
  .refine(isTimeZone, 'Must be a valid IANA timezone, e.g. Asia/Kolkata');

export const countryCodeSchema = z
  .string()
  .transform((value) => value.toUpperCase())
  .refine(isCountryCode, 'Must be an ISO 3166-1 alpha-2 country code');

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
