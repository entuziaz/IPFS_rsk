type LogContext = Record<string, unknown>;

const isDevelopment = import.meta.env.DEV;

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

export const logger = {
  error(message: string, context?: LogContext) {
    if (!isDevelopment) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("app:log", {
        detail: {
          level: "error",
          message,
          context,
          timestamp: new Date().toISOString(),
        },
      })
    );
  },
  serializeError,
};
