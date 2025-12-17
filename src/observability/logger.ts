import { logs, type AnyValue } from "@opentelemetry/api-logs";

const _logger = logs.getLogger("newsletter");

const SEVERITY_TEXT = {
  log: "LOG",
  debug: "DEBUG",
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
};

type SeverityText = keyof typeof SEVERITY_TEXT;
type Logger = Record<SeverityText, (message: AnyValue) => void>;

const logger = new Proxy<Logger>({} as Logger, {
  get: (_target, prop: SeverityText) => {
    return (message: AnyValue) => {
      if (prop in console) {
        const prefix = `(newsletter) [${SEVERITY_TEXT[prop]}]`;
        const prefixLength = prefix.length + 2;
        const _message = Bun.inspect(message, { depth: 5, colors: true })
          .split("\\n")
          .map((line, index) =>
            index === 0 ? line : " ".repeat(prefixLength) + line
          )
          .join("\n");
        console[prop](prefix, _message);
      }

      _logger.emit({
        severityText: SEVERITY_TEXT[prop],
        body: message,
      });
    };
  },
});

export default logger;
