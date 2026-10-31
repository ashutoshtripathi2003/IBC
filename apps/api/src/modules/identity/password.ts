import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

/**
 * Password hashing with scrypt (OWASP-recommended; built into Node, no native
 * dependency, identical on macOS/Windows/Linux).
 *
 * Hashes are self-describing (`$scrypt$ln=17,r=8,p=1$<salt>$<hash>`), so cost can
 * be raised — or the algorithm replaced (e.g. argon2id) — by rehashing on the next
 * successful login without invalidating existing credentials.
 */
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const BLOCK_SIZE = 8;
const PARALLELISM = 1;
const HASH_PATTERN =
  /^\$scrypt\$ln=(\d{1,2}),r=(\d{1,2}),p=(\d{1,2})\$([A-Za-z0-9+/=]+)\$([A-Za-z0-9+/=]+)$/;

function derive(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  const cost = options.N ?? 2 ** 17;
  const blockSize = options.r ?? BLOCK_SIZE;
  // scrypt needs ~128 * N * r bytes; allow headroom above Node's 32 MiB default.
  const maxmem = 256 * cost * blockSize;
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFC'), salt, KEY_LENGTH, { ...options, maxmem }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string, log2Cost: number): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await derive(password, salt, { N: 2 ** log2Cost, r: BLOCK_SIZE, p: PARALLELISM });
  return `$scrypt$ln=${log2Cost},r=${BLOCK_SIZE},p=${PARALLELISM}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const match = HASH_PATTERN.exec(encoded);
  if (!match) return false;
  const [, ln, r, p, salt, hash] = match;
  const expected = Buffer.from(hash!, 'base64');
  const actual = await derive(password, Buffer.from(salt!, 'base64'), {
    N: 2 ** Number(ln),
    r: Number(r),
    p: Number(p),
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** True when the stored hash is weaker than current policy and should be upgraded. */
export function needsRehash(encoded: string, log2Cost: number): boolean {
  const match = HASH_PATTERN.exec(encoded);
  return !match || Number(match[1]) < log2Cost;
}
