import { z } from 'zod';

/**
 * OpenAPI 3.1 generation from the same zod schemas that validate requests, so the
 * published contract and runtime validation cannot diverge. Each module declares
 * its operations; `test/openapi.test.ts` checks every registered route is documented.
 */
export interface ApiOperation {
  method: 'get' | 'post' | 'patch' | 'put' | 'delete';
  /** OpenAPI path, e.g. `/v1/auth/sessions/{sessionId}`. */
  path: string;
  operationId: string;
  summary: string;
  description?: string;
  tags: string[];
  /** Requires `Authorization: Bearer <session token>`. */
  authenticated: boolean;
  params?: z.ZodObject;
  body?: z.ZodType;
  success: { status: number; description: string; schema?: z.ZodType };
  /** Error statuses this operation can return (rendered as problem+json). */
  errors: number[];
}

const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: 'Invalid request (`validation_failed`, `invalid_token`, malformed JSON).',
  401: 'Missing, invalid, expired or revoked credentials.',
  403: 'Authenticated but not permitted (`forbidden`, `account_inactive`).',
  404: 'Not found.',
  409: 'Conflict (e.g. `email_taken`).',
  413: 'Request body larger than 64 KiB.',
  415: 'Content type is not `application/json`.',
  429: 'Rate limited (`rate_limited`, `too_many_attempts`, `too_many_requests`). See `retry-after`.',
  500: 'Unexpected error (`internal_error`); no internal details are returned.',
  503: 'Not ready.',
};

const problemSchema = {
  type: 'object',
  description: 'RFC 9457 problem details. Branch on `code`, not `detail`.',
  required: ['type', 'title', 'status', 'code', 'detail', 'requestId'],
  properties: {
    type: { type: 'string', example: 'about:blank' },
    title: { type: 'string' },
    status: { type: 'integer' },
    code: { type: 'string', description: 'Stable machine-readable error code.' },
    detail: { type: 'string' },
    requestId: { type: 'string' },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        required: ['path', 'message'],
        properties: { path: { type: 'string' }, message: { type: 'string' } },
      },
    },
  },
} as const;

type JsonSchema = Record<string, unknown>;

export function buildOpenApiDocument(options: {
  version: string;
  serverUrl?: string;
  operations: readonly ApiOperation[];
}): JsonSchema {
  // Schemas named with `.meta({ id })` are emitted once under components/schemas.
  const components: Record<string, JsonSchema> = {};
  const convert = (schema: z.ZodType, io: 'input' | 'output'): JsonSchema => {
    const generated = z.toJSONSchema(schema, {
      io,
      target: 'draft-2020-12',
      // Transforms/refinements are runtime-only; describe their input shape.
      unrepresentable: 'any',
    }) as JsonSchema;
    const json = JSON.parse(
      JSON.stringify(generated).replaceAll('"#/$defs/', '"#/components/schemas/'),
    ) as JsonSchema & { $defs?: Record<string, JsonSchema>; id?: string };
    for (const [id, definition] of Object.entries(json.$defs ?? {})) components[id] = definition;
    delete json.$defs;
    delete json.$schema;
    if (io === 'output') {
      // Responses may gain fields within /v1 (additive changes), so clients must tolerate them.
      allowAdditionalProperties(json);
      Object.values(components).forEach(allowAdditionalProperties);
    }
    // A top-level named schema becomes a component and is referenced.
    if (typeof json.id === 'string') {
      const id = json.id;
      delete json.id;
      components[id] = json;
      return { $ref: `#/components/schemas/${id}` };
    }
    return json;
  };

  const paths: Record<string, Record<string, JsonSchema>> = {};
  for (const op of options.operations) {
    const responses: Record<string, JsonSchema> = {
      [op.success.status]: {
        description: op.success.description,
        ...(op.success.schema
          ? { content: { 'application/json': { schema: convert(op.success.schema, 'output') } } }
          : {}),
      },
    };
    for (const status of [...op.errors].sort((a, b) => a - b)) {
      responses[status] = { $ref: `#/components/responses/Problem${status}` };
    }
    const parameters = op.params
      ? Object.entries(op.params.shape).map(([name, schema]) => ({
          name,
          in: 'path',
          required: true,
          schema: convert(schema as z.ZodType, 'input'),
        }))
      : undefined;

    (paths[op.path] ??= {})[op.method] = {
      operationId: op.operationId,
      summary: op.summary,
      ...(op.description ? { description: op.description } : {}),
      tags: op.tags,
      security: op.authenticated ? [{ sessionToken: [] }] : [],
      ...(parameters ? { parameters } : {}),
      ...(op.body
        ? {
            requestBody: {
              required: true,
              content: { 'application/json': { schema: convert(op.body, 'input') } },
            },
          }
        : {}),
      responses,
    };
  }

  const usedErrors = new Set(options.operations.flatMap((op) => op.errors));
  const errorResponses = Object.fromEntries(
    [...usedErrors]
      .sort((a, b) => a - b)
      .map((status) => [
        `Problem${status}`,
        {
          description: ERROR_DESCRIPTIONS[status] ?? 'Error.',
          content: {
            'application/problem+json': { schema: { $ref: '#/components/schemas/Problem' } },
          },
        },
      ]),
  );

  return {
    openapi: '3.1.0',
    info: {
      title: 'IBC Platform API',
      version: options.version,
      description:
        'IBC — Industrial Business Circle platform API. JSON only; every response carries `x-request-id`; ' +
        'errors are RFC 9457 problem documents. `/v1` changes are additive only.',
    },
    ...(options.serverUrl ? { servers: [{ url: options.serverUrl }] } : {}),
    paths,
    components: {
      securitySchemes: {
        sessionToken: {
          type: 'http',
          scheme: 'bearer',
          description: 'Opaque session token (`ibc_st_…`) from register or login.',
        },
      },
      schemas: { Problem: problemSchema, ...sortKeys(components) },
      responses: errorResponses,
    },
  };
}

function sortKeys<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}

function allowAdditionalProperties(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach(allowAdditionalProperties);
  } else if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>;
    if (record.additionalProperties === false) delete record.additionalProperties;
    Object.values(record).forEach(allowAdditionalProperties);
  }
}
