import { uuidv7 } from '@ibc/kernel';
import type { IncomingMessage } from 'node:http';

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{8,128}$/;

/**
 * Accepts a well-formed upstream `x-request-id` (from the edge/load balancer)
 * so one ID follows the request across services; otherwise generates one.
 */
export function generateRequestId(request: IncomingMessage): string {
  const incoming = request.headers['x-request-id'];
  if (typeof incoming === 'string' && SAFE_REQUEST_ID.test(incoming)) return incoming;
  return uuidv7();
}
