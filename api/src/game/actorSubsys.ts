import awaiterResolve from "@yingyeothon/actor-system-redis-support/lib/awaiter/resolve";
import awaiterWait from "@yingyeothon/actor-system-redis-support/lib/awaiter/wait";
import lockAcquire from "@yingyeothon/actor-system-redis-support/lib/lock/acquire";
import lockRelease from "@yingyeothon/actor-system-redis-support/lib/lock/release";
import queueFlush from "@yingyeothon/actor-system-redis-support/lib/queue/flush";
import queueSize from "@yingyeothon/actor-system-redis-support/lib/queue/size";
import { ConsoleLogger } from "@yingyeothon/logger";
import actorSubsysKeys from "../shared/actorSubsysKeys";
import { gameAliveSeconds } from "./model/constraints";
import redisConnection from "./redisConnection";

const logger = new ConsoleLogger(`info`);

const actorSubsys = {
  awaiter: {
    ...awaiterResolve({
      connection: redisConnection,
      keyPrefix: actorSubsysKeys.awaiterKeyPrefix,
      logger
    }),
    ...awaiterWait({
      connection: redisConnection,
      keyPrefix: actorSubsysKeys.awaiterKeyPrefix,
      logger
    })
  },
  queue: {
    ...queueFlush({
      connection: redisConnection,
      keyPrefix: actorSubsysKeys.queueKeyPrefix,
      logger
    }),
    ...queueSize({
      connection: redisConnection,
      keyPrefix: actorSubsysKeys.queueKeyPrefix,
      logger
    })
  },
  lock: {
    ...lockAcquire({
      connection: redisConnection,
      keyPrefix: actorSubsysKeys.lockKeyPrefix,
      logger,
      lockTimeout: (gameAliveSeconds + 10) * 1000
    }),
    ...lockRelease({
      connection: redisConnection,
      keyPrefix: actorSubsysKeys.lockKeyPrefix,
      logger
    })
  },
  logger
};
export default actorSubsys;
