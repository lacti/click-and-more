import { ConsoleLogger } from "@yingyeothon/logger";

const logger = new ConsoleLogger(
  process.env.STAGE === "production" ? `info` : `debug`
);

export default logger;
