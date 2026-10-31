import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/platform/config.js';

describe('configuration', () => {
  it('fails fast and lists every problem', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(
      /DATABASE_URL[\s\S]*PORT|PORT[\s\S]*DATABASE_URL/,
    );
  });

  it('enforces production password hashing cost', () => {
    expect(() =>
      loadConfig({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://x',
        PASSWORD_HASH_LOG2_COST: '12',
      }),
    ).toThrow(/PASSWORD_HASH_LOG2_COST/);
  });

  it('refuses the log email transport and non-https links in production', () => {
    const base = { NODE_ENV: 'production', DATABASE_URL: 'postgres://x' };
    expect(() => loadConfig(base)).toThrow(/EMAIL_TRANSPORT[\s\S]*EMAIL_FROM[\s\S]*APP_BASE_URL/);
    expect(() =>
      loadConfig({
        ...base,
        EMAIL_TRANSPORT: 'ses',
        EMAIL_FROM: 'IBC <no-reply@mail.example.com>',
        APP_BASE_URL: 'https://app.example.com',
      }),
    ).not.toThrow();
  });

  it('defaults to the AWS Mumbai region', () => {
    expect(loadConfig({ DATABASE_URL: 'postgres://x' }).AWS_REGION).toBe('ap-south-1');
  });

  it('parses lists and defaults', () => {
    const config = loadConfig({
      DATABASE_URL: 'postgres://x',
      CORS_ALLOWED_ORIGINS: 'https://a.example, https://b.example',
    });
    expect(config.CORS_ALLOWED_ORIGINS).toEqual(['https://a.example', 'https://b.example']);
    expect(config.PORT).toBe(3000);
    expect(config.PASSWORD_HASH_LOG2_COST).toBe(17);
  });
});
