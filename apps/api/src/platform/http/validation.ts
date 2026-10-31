import type { z } from 'zod';
import { Errors } from './errors.js';

/** Validates untrusted input against a schema, raising a 400 problem on failure. */
export function parseInput<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw Errors.validation(
      result.error.issues.map((issue) => ({
        path: issue.path.join('.') || '(root)',
        message: issue.message,
      })),
    );
  }
  return result.data;
}
