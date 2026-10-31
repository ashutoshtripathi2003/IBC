import { z } from 'zod';
import type { ApiOperation } from '../http/openapi.js';

export const healthOperations: ApiOperation[] = [
  {
    method: 'get',
    path: '/health/live',
    operationId: 'liveness',
    summary: 'Liveness probe',
    description: 'The process is running. Does not check dependencies.',
    tags: ['Health'],
    authenticated: false,
    success: { status: 200, description: 'Alive.', schema: z.object({ status: z.literal('ok') }) },
    errors: [],
  },
  {
    method: 'get',
    path: '/health/ready',
    operationId: 'readiness',
    summary: 'Readiness probe',
    description: 'Ready to serve traffic: database reachable and not draining.',
    tags: ['Health'],
    authenticated: false,
    success: {
      status: 200,
      description: 'Ready.',
      schema: z.object({
        status: z.literal('ready'),
        service: z.string(),
        version: z.string(),
        region: z.string(),
        checks: z.record(z.string(), z.enum(['ok', 'fail'])),
      }),
    },
    errors: [503],
  },
];
