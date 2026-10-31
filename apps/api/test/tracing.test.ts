import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { testConfig } from './helpers.js';

/**
 * End-to-end tracing test: runs the real API process with the telemetry preload
 * (exactly how production starts it) against an in-process OTLP/HTTP collector.
 */
interface ExportedSpan {
  name: string;
  traceId: string;
  scope: string;
  attributes: Record<string, unknown>;
}

const API_DIR = fileURLToPath(new URL('..', import.meta.url));
const TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736';

function listen(server: http.Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve((server.address() as AddressInfo).port);
    });
  });
}

async function freePort(): Promise<number> {
  const server = http.createServer();
  const port = await listen(server);
  await new Promise((resolve) => server.close(resolve));
  return port;
}

describe('distributed tracing', () => {
  const spans: ExportedSpan[] = [];
  let collector: http.Server;
  let api: ChildProcess;
  let apiUrl: string;
  let logs = '';

  beforeAll(async () => {
    collector = http.createServer((request, response) => {
      let body = '';
      request.on('data', (chunk: Buffer) => (body += chunk.toString()));
      request.on('end', () => {
        const payload = JSON.parse(body);
        for (const resourceSpans of payload.resourceSpans ?? []) {
          for (const scopeSpans of resourceSpans.scopeSpans ?? []) {
            for (const span of scopeSpans.spans ?? []) {
              spans.push({
                name: span.name,
                traceId: span.traceId,
                scope: scopeSpans.scope.name,
                attributes: Object.fromEntries(
                  (span.attributes ?? []).map(
                    (a: { key: string; value: Record<string, unknown> }) => [
                      a.key,
                      Object.values(a.value)[0],
                    ],
                  ),
                ),
              });
            }
          }
        }
        response.writeHead(200, { 'content-type': 'application/json' }).end('{}');
      });
    });
    const collectorPort = await listen(collector);
    const apiPort = await freePort();
    apiUrl = `http://127.0.0.1:${apiPort}`;

    api = spawn(
      process.execPath,
      [
        '--conditions=@ibc/source',
        '--import',
        'tsx',
        '--import',
        './src/telemetry.ts',
        'src/main.ts',
      ],
      {
        cwd: API_DIR,
        env: {
          ...process.env,
          NODE_ENV: 'test',
          DATABASE_URL: testConfig().DATABASE_URL,
          PORT: String(apiPort),
          HOST: '127.0.0.1',
          LOG_LEVEL: 'info',
          OTEL_EXPORTER_OTLP_ENDPOINT: `http://127.0.0.1:${collectorPort}`,
          NO_PROXY: '127.0.0.1,localhost',
          no_proxy: '127.0.0.1,localhost',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    api.stdout?.on('data', (chunk: Buffer) => (logs += chunk.toString()));
    api.stderr?.on('data', (chunk: Buffer) => (logs += chunk.toString()));

    const deadline = Date.now() + 20_000;
    for (;;) {
      try {
        if ((await fetch(`${apiUrl}/health/live`)).ok) break;
      } catch {
        // not listening yet
      }
      if (Date.now() > deadline) throw new Error(`API did not start:\n${logs}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }, 30_000);

  afterAll(async () => {
    if (api.exitCode === null) {
      api.kill('SIGTERM');
      await once(api, 'exit');
    }
    await new Promise((resolve) => collector.close(resolve));
  });

  it('continues the caller trace across HTTP and SQL, names spans by route and leaks no secrets', async () => {
    const password = 'tracing test passphrase';
    const email = `trace${Date.now()}@example.com`;
    const traceparent = `00-${TRACE_ID}-00f067aa0ba902b7-01`;
    const register = await fetch(`${apiUrl}/v1/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', traceparent },
      body: JSON.stringify({ email, password, displayName: 'Trace Test' }),
    });
    expect(register.status).toBe(201);
    const { session } = (await register.json()) as { session: { token: string } };
    const me = await fetch(`${apiUrl}/v1/me`, {
      headers: { authorization: `Bearer ${session.token}` },
    });
    expect(me.status).toBe(200);
    await fetch(`${apiUrl}/health/ready`);

    // Graceful shutdown must flush buffered spans before the process exits.
    api.kill('SIGTERM');
    const [code] = (await once(api, 'exit')) as [number | null];
    expect(code).toBe(0);

    const registerTrace = spans.filter((span) => span.traceId === TRACE_ID);
    const httpSpan = registerTrace.find((span) => span.name === 'POST /v1/auth/register');
    expect(httpSpan?.attributes['http.route']).toBe('/v1/auth/register');
    const sql = registerTrace.filter((span) => span.scope.includes('instrumentation-pg'));
    expect(sql.map((span) => span.name)).toEqual(
      expect.arrayContaining([
        'pg.query:BEGIN ibc_test',
        'pg.query:INSERT ibc_test',
        'pg.query:COMMIT ibc_test',
      ]),
    );

    expect(spans.some((span) => span.name === 'GET /v1/me')).toBe(true);
    expect(spans.some((span) => JSON.stringify(span).includes('/health'))).toBe(false);

    const exported = JSON.stringify(spans);
    for (const secret of [email, password, session.token]) expect(exported).not.toContain(secret);

    // Logs written while handling a traced request carry its trace id.
    expect(logs).toContain(`"trace_id":"${TRACE_ID}"`);
  });
});
