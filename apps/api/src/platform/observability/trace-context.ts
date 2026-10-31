import { SpanStatusCode, trace, type Attributes } from '@opentelemetry/api';

/** IDs of the active span, for correlating logs with traces. Empty when tracing is off. */
export function activeTraceIds(): { trace_id?: string; span_id?: string } {
  const spanContext = trace.getActiveSpan()?.spanContext();
  if (!spanContext || spanContext.traceId === '00000000000000000000000000000000') return {};
  return { trace_id: spanContext.traceId, span_id: spanContext.spanId };
}

/**
 * Names the active HTTP server span after the matched route template (e.g.
 * "GET /v1/auth/sessions/:sessionId") so traces group by endpoint, not raw URL.
 */
export function nameActiveHttpSpan(method: string, routeTemplate: string | undefined): void {
  const span = trace.getActiveSpan();
  if (!span || !routeTemplate) return;
  span.updateName(`${method} ${routeTemplate}`);
  span.setAttribute('http.route', routeTemplate);
}

const tracer = trace.getTracer('ibc-api');

/** Runs `work` in a new span (no-op when tracing is disabled), recording failures. */
export async function withSpan<T>(
  name: string,
  attributes: Attributes,
  work: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      return await work();
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}

export const TELEMETRY_SHUTDOWN = Symbol.for('ibc.telemetry.shutdown');

/** Flushes and stops tracing if it was started; bounded so shutdown cannot hang. */
export async function shutdownTelemetry(timeoutMs = 5000): Promise<void> {
  const shutdown = (globalThis as Record<symbol, unknown>)[TELEMETRY_SHUTDOWN];
  if (typeof shutdown !== 'function') return;
  let timer: NodeJS.Timeout | undefined;
  await Promise.race([
    (shutdown as () => Promise<void>)().catch(() => undefined),
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, timeoutMs);
    }),
  ]);
  clearTimeout(timer);
}
