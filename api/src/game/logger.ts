import { Logger } from "../shared/logger";

let globalLogger: Logger | null;

export function setLogger(logger: Logger) {
  globalLogger = logger;
}

export function getLogger() {
  return globalLogger!;
}
