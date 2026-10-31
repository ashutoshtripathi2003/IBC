import {
  context,
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
  propagation,
  trace,
} from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BatchSpanProcessor,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
  TracerProvider,
} from '@opentelemetry/sdk-trace';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { TELEMETRY_SHUTDOWN } from './trace-context.js';

/** Paths that are polled constantly and would only add noise and cost. */
const UNTRACED_PATHS = new Set(['/health/live', '/health/ready']);

function samplingRatio(): number {
  const value = Number(process.env.OTEL_TRACES_SAMPLER_ARG ?? '1');
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 1;
}

export function startTracing(): void {
  const env = process.env;
  // Surface exporter failures (e.g. collector unreachable) without flooding logs.
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);
  const provider = new TracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: env.OTEL_SERVICE_NAME ?? env.SERVICE_NAME ?? 'ibc-api',
      [ATTR_SERVICE_VERSION]: env.SERVICE_VERSION ?? '0.0.0-dev',
      'deployment.environment.name': env.NODE_ENV ?? 'development',
      ...(env.DEPLOYMENT_REGION && env.DEPLOYMENT_REGION !== 'local'
        ? { 'cloud.provider': 'aws', 'cloud.region': env.DEPLOYMENT_REGION }
        : {}),
    }),
    // Respect the caller's sampling decision; sample new root traces at OTEL_TRACES_SAMPLER_ARG.
    sampler: new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(samplingRatio()) }),
    // The exporter reads OTEL_EXPORTER_OTLP_* endpoint/header variables itself.
    spanProcessors: [new BatchSpanProcessor({ exporter: new OTLPTraceExporter() })],
  });

  context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
  propagation.setGlobalPropagator(
    new CompositePropagator({
      propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()],
    }),
  );
  trace.setGlobalTracerProvider(provider);

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (request) =>
          UNTRACED_PATHS.has((request.url ?? '').split('?')[0] ?? ''),
      }),
      // Statement text is recorded with bind parameters as placeholders, never values.
      new PgInstrumentation({ enhancedDatabaseReporting: false }),
    ],
  });

  // Entry points call shutdownTelemetry() before exiting so buffered spans are flushed.
  (globalThis as Record<symbol, unknown>)[TELEMETRY_SHUTDOWN] = () => provider.shutdown();
}
