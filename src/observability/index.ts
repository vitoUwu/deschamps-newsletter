import { logs } from "@opentelemetry/api-logs";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ConsoleLogRecordExporter,
  LoggerProvider,
  SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import {
  ConsoleMetricExporter,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: "newsletter",
  [ATTR_SERVICE_VERSION]: "0.0.1",
});

const logsExporter =
  process.env.OTEL_LOGS_EXPORTER === "otlp"
    ? new OTLPLogExporter({
        url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/logs`,
      })
    : new ConsoleLogRecordExporter();

const loggerProvider = new LoggerProvider({
  resource,
  processors: [new SimpleLogRecordProcessor(logsExporter)],
});

logs.setGlobalLoggerProvider(loggerProvider);

const sdk = new NodeSDK({
  resource,
  traceExporter: new ConsoleSpanExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new ConsoleMetricExporter(),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
