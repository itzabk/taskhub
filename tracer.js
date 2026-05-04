import 'dotenv/config.js';

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';

import { resourceFromAttributes } from '@opentelemetry/resources';

import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

import { NodeSDK } from '@opentelemetry/sdk-node';

import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';

import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

diag.setLogger(
  new DiagConsoleLogger(),
  process.env.OTEL_DIAG_LOG_LEVEL === 'debug' ? DiagLogLevel.DEBUG : DiagLogLevel.ERROR
);

// TODO:Check if env importing config properly
const serviceName = process.env.OTEL_SERVICE_NAME || 'taskhub-api';

export const otelSdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: process.env.OTEL_SERVICE_VERSION || '1.0.0',
    'deployment.environment.name':
      process.env.OTEL_DEPLOYMENT_ENVIRONMENT || process.env.NODE_ENV || 'development',
  }),

  sampler: new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(Number(process.env.OTEL_TRACE_SAMPLE_RATIO || 1)),
  }),

  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
  }),

  metricReaders: [
    new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT || 'http://localhost:4318/v1/metrics',
      }),
      exportIntervalMillis: Number(process.env.OTEL_METRIC_EXPORT_INTERVAL_MS || 60000),
    }),
  ],

  // TODO: Open telemetry is causing max listeners count to exceed for router (req,res). (false for now) Think of a better strategy
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-router': { enabled: false },
      '@opentelemetry/instrumentation-pino': { enabled: false },
    }),

    new PinoInstrumentation({
      logHook: (_span, record) => {
        record['service.name'] = serviceName;
      },
    }),
  ],
});

otelSdk.start();
