import { describe, expect, it } from 'vitest';
import { hashPassword, needsRehash, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('verifies the original password and rejects others', async () => {
    const hash = await hashPassword('correct horse battery staple', 12);
    expect(hash).toMatch(/^\$scrypt\$ln=12,r=8,p=1\$/);
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
    expect(await verifyPassword('correct horse battery stapl', hash)).toBe(false);
  });

  it('salts every hash', async () => {
    expect(await hashPassword('same password here', 10)).not.toBe(
      await hashPassword('same password here', 10),
    );
  });

  it('normalizes Unicode so equivalent input verifies', async () => {
    const hash = await hashPassword('café-password-1', 10);
    expect(await verifyPassword('café-password-1', hash)).toBe(true);
  });

  it('rejects malformed hashes without throwing', async () => {
    expect(await verifyPassword('anything', 'not-a-hash')).toBe(false);
  });

  it('flags hashes weaker than policy for rehash', async () => {
    const hash = await hashPassword('rehash me please', 10);
    expect(needsRehash(hash, 10)).toBe(false);
    expect(needsRehash(hash, 12)).toBe(true);
    expect(needsRehash('legacy', 10)).toBe(true);
  });
});
