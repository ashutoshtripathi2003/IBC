/**
 * OpenTelemetry tracing bootstrap. Preload it before the application:
 *
 *   node --import ./dist/telemetry.js dist/main.js
 *
 * Tracing is enabled only when OTEL_EXPORTER_OTLP_ENDPOINT (or
 * OTEL_EXPORTER_OTLP_TRACES_ENDPOINT) is set and OTEL_SDK_DISABLED is not "true";
 * otherwise this file does nothing and the @opentelemetry/api calls in the app are no-ops.
 * Standard OTEL_* variables apply (OTEL_SERVICE_NAME, OTEL_TRACES_SAMPLER_ARG, ...).
 * On AWS the exporter targets the ADOT collector sidecar, which forwards to X-Ray.
 */
import { register } from 'node:module';

const endpoint =
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const enabled = Boolean(endpoint) && process.env.OTEL_SDK_DISABLED !== 'true';

if (enabled) {
  // ESM modules can only be patched through a loader hook registered before they load.
  register('@opentelemetry/instrumentation/hook.mjs', import.meta.url);
  const { startTracing } = await import('./platform/observability/tracing.js');
  startTracing();
}

export {};
