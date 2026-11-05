/**
 * Identity email copy. Keyed by template and locale so translations can be added
 * without code changes elsewhere; unknown locales fall back by language, then to English.
 * Links carry the token in the URL fragment so it never reaches web-server logs or
 * Referer headers; the web app reads it and POSTs it to the API.
 */
export type IdentityEmailTemplate = 'verify_email' | 'password_reset' | 'password_changed';

interface Copy {
  subject: string;
  body: (params: { displayName: string; link?: string; expiresIn?: string }) => string;
}

const catalog: Record<string, Record<IdentityEmailTemplate, Copy>> = {
  en: {
    verify_email: {
      subject: 'Verify your email for IBC',
      body: ({ displayName, link, expiresIn }) =>
        `Hello ${displayName},\n\nPlease confirm your email address for IBC — Industrial Business Circle:\n\n${link}\n\nThis link expires in ${expiresIn}. If you did not create an IBC account, you can ignore this email.\n`,
    },
    password_reset: {
      subject: 'Reset your IBC password',
      body: ({ displayName, link, expiresIn }) =>
        `Hello ${displayName},\n\nWe received a request to reset your IBC password. Use this link to choose a new one:\n\n${link}\n\nThis link expires in ${expiresIn} and can be used once. If you did not request this, you can ignore this email; your password will not change.\n`,
    },
    password_changed: {
      subject: 'Your IBC password was changed',
      body: ({ displayName }) =>
        `Hello ${displayName},\n\nThe password for your IBC account was just changed and all of your sessions were signed out.\n\nIf you did not do this, reset your password immediately and contact IBC support.\n`,
    },
  },
};

export function renderIdentityEmail(
  template: IdentityEmailTemplate,
  locale: string,
  params: { displayName: string; link?: string; expiresIn?: string },
): { locale: string; subject: string; textBody: string } {
  const language = locale.split('-')[0] ?? 'en';
  const resolved = catalog[locale] ? locale : catalog[language] ? language : 'en';
  const copy = catalog[resolved]![template];
  return { locale: resolved, subject: copy.subject, textBody: copy.body(params) };
}

export function describeDuration(minutes: number): string {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  return `${minutes} minutes`;
}
