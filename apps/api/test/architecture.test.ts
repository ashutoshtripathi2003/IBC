import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Enforces the service's internal architecture (see docs/ARCHITECTURE.md):
 *  1. `platform/` is domain-agnostic and never imports from `modules/`.
 *  2. A module may import another module only through its public `index.ts`.
 *  3. Only the owning module touches its database schema in SQL.
 */
const SRC = fileURLToPath(new URL('../src', import.meta.url));
const MODULE_SCHEMAS: Record<string, string> = { identity: 'identity' };

async function sourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(full);
      return Promise.resolve(
        entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [full] : [],
      );
    }),
  );
  return files.flat();
}

function imports(source: string): string[] {
  return [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]!);
}

function moduleOf(file: string): string | null {
  const rel = path.relative(SRC, file).split(path.sep);
  return rel[0] === 'modules' ? rel[1]! : null;
}

describe('architecture boundaries', () => {
  it('keeps platform code independent of domain modules', async () => {
    const violations: string[] = [];
    for (const file of await sourceFiles(path.join(SRC, 'platform'))) {
      for (const spec of imports(await readFile(file, 'utf8'))) {
        if (
          spec.startsWith('.') &&
          path.resolve(path.dirname(file), spec).includes(`${path.sep}modules${path.sep}`)
        ) {
          violations.push(`${path.relative(SRC, file)} -> ${spec}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('only allows cross-module imports through public index files', async () => {
    const violations: string[] = [];
    for (const file of await sourceFiles(path.join(SRC, 'modules'))) {
      const owner = moduleOf(file);
      for (const spec of imports(await readFile(file, 'utf8'))) {
        if (!spec.startsWith('.')) continue;
        const target = path.resolve(path.dirname(file), spec);
        const targetModule = moduleOf(target);
        if (targetModule && targetModule !== owner && !/[\\/]index\.js$/.test(target)) {
          violations.push(`${path.relative(SRC, file)} -> ${spec}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('only lets a module query its own schema', async () => {
    const violations: string[] = [];
    for (const file of await sourceFiles(SRC)) {
      const owner = moduleOf(file);
      const source = await readFile(file, 'utf8');
      for (const [module, schema] of Object.entries(MODULE_SCHEMAS)) {
        // Matches SQL table references such as `FROM identity.users`; ignores prose and event names.
        const sqlReference = new RegExp(`\\b(FROM|JOIN|INTO|UPDATE|TABLE)\\s+${schema}\\.`, 'i');
        if (module !== owner && sqlReference.test(source)) {
          violations.push(`${path.relative(SRC, file)} references schema "${schema}"`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
