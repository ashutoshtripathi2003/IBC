import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { apiDocument } from './api-contract.js';

/** Writes the OpenAPI document to docs/openapi.json for client generation and review. */
const target = fileURLToPath(new URL('../../../docs/openapi.json', import.meta.url));
await writeFile(target, `${JSON.stringify(apiDocument(), null, 2)}\n`);
console.log(`wrote ${target}`);
