type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}

function writeLog(level: LogLevel, message: string, context?: LogContext) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ? { context } : {}),
  };

  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

export const logger = {
  info(message: string, context?: LogContext) {
    writeLog("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    writeLog("warn", message, context);
  },
  error(message: string, context?: LogContext) {
    writeLog("error", message, context);
  },
  serializeError,
};
