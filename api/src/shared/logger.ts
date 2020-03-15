import { ConsoleLogger, ILogger, LogSeverity } from "@yingyeothon/logger";
import { LambdaS3Logger } from "@yingyeothon/logger-s3";
import {
  APIGatewayEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult
} from "aws-lambda";

interface ILoggerEnv {
  logKeyPrefix?: string;
  systemName?: string;
  lambdaId: string;
  handlerName: string;
  systemId?: string;
}

export type Logger = ILogger & {
  updateSystemId: (systemId: string) => void;
  flush: () => Promise<any>;
};

export function newLogger({
  logKeyPrefix = "logging",
  systemName = "click-and-more",
  lambdaId,
  handlerName,
  systemId
}: ILoggerEnv): Logger {
  if (!("S3CB_URL" in process.env)) {
    return newConsoleLogger({
      logKeyPrefix,
      systemName,
      lambdaId,
      handlerName,
      systemId
    });
  }

  const { logger, updateSystemId, flush } = LambdaS3Logger({
    logKeyPrefix,
    systemName,
    handlerName,
    lambdaId,
    systemId,

    severity: "debug",
    apiUrl: process.env.S3CB_URL!,
    apiId: process.env.S3CB_ID,
    apiPassword: process.env.S3CB_PASSWORD
  });
  return { ...logger, updateSystemId, flush };
}

function newConsoleLogger({
  systemName,
  systemId,
  handlerName,
  lambdaId
}: ILoggerEnv): Logger {
  const consoleLogger = new ConsoleLogger("debug");
  function write(level: LogSeverity) {
    return (args: any[]) =>
      consoleLogger[level]([
        new Date().toISOString(),
        level.toString(),
        ...[systemName, systemId, handlerName, lambdaId],
        ...args
      ]);
  }
  return {
    severity: "debug",
    debug: write("debug"),
    info: write("info"),
    error: write("error"),
    updateSystemId: () => 0,
    flush: () => Promise.resolve()
  };
}

export function handleWithLogger(env: Omit<ILoggerEnv, "lambdaId">) {
  return (
    delegate: ({
      event
    }: {
      event: APIGatewayEvent;
      logger: Logger;
    }) => Promise<APIGatewayProxyResult>
  ): APIGatewayProxyHandler => async event => {
    const logger = newLogger({
      ...env,
      lambdaId: event.requestContext.requestId
    });
    async function safeFlush() {
      try {
        await logger.flush();
      } catch (error) {
        console.error(`Cannot flush logger`, error);
      }
    }
    try {
      const response = await delegate({ event, logger });
      await safeFlush();
      return response;
    } finally {
      await safeFlush();
    }
  };
}
