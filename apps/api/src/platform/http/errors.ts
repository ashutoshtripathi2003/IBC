/**
 * Application errors. Every error that reaches a client is rendered as an
 * RFC 9457 `application/problem+json` document with a stable machine `code`.
 */
export interface FieldError {
  path: string;
  message: string;
}

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors?: FieldError[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  validation: (fieldErrors: FieldError[]) =>
    new AppError(400, 'validation_failed', 'The request is invalid.', fieldErrors),
  unauthenticated: () => new AppError(401, 'unauthenticated', 'Authentication is required.'),
  invalidCredentials: () =>
    new AppError(401, 'invalid_credentials', 'The email or password is incorrect.'),
  forbidden: () => new AppError(403, 'forbidden', 'You do not have permission to do this.'),
  notFound: (what = 'Resource') => new AppError(404, 'not_found', `${what} not found.`),
  conflict: (code: string, message: string) => new AppError(409, code, message),
} as const;
