import awaiterResolve from "@yingyeothon/actor-system-redis-support/lib/awaiter/resolve";
import awaiterWait from "@yingyeothon/actor-system-redis-support/lib/awaiter/wait";
import lockAcquire from "@yingyeothon/actor-system-redis-support/lib/lock/acquire";
import lockRelease from "@yingyeothon/actor-system-redis-support/lib/lock/release";
import queueFlush from "@yingyeothon/actor-system-redis-support/lib/queue/flush";
import queueSize from "@yingyeothon/actor-system-redis-support/lib/queue/size";
import actorEventLoop from "@yingyeothon/actor-system/lib/actor/eventLoop";
import { ConsoleLogger } from "@yingyeothon/logger";
import redisConnect from "@yingyeothon/naive-redis/lib/connection";
import { Handler } from "aws-lambda";
import { IGameActorEvent } from "../shared/actorRequest";
import { GameRequest } from "../shared/gameRequest";
import Game from "./game";
import env from "./support/env";

const logger = new ConsoleLogger(`info`);
const redisConnection = redisConnect({
  host: env.redisHost,
  password: env.redisPassword
});
const subsys = {
  awaiter: {
    ...awaiterResolve({ connection: redisConnection, logger }),
    ...awaiterWait({ connection: redisConnection, logger })
  },
  queue: {
    ...queueFlush({ connection: redisConnection, logger }),
    ...queueSize({ connection: redisConnection, logger })
  },
  lock: {
    ...lockAcquire({ connection: redisConnection, logger }),
    ...lockRelease({ connection: redisConnection, logger })
  },
  logger
};

export const handle: Handler<IGameActorEvent, void> = async event => {
  const { gameId, invokerConnectionId } = event;
  if (!gameId) {
    logger.error(`No gameId from payload`, event);
    return;
  }

  logger.debug(`Game is invoked from`, gameId, invokerConnectionId);
  await actorEventLoop<GameRequest>({
    ...subsys,
    id: gameId,
    loop: async poll => {
      logger.info(`Start a game with Id`, gameId, invokerConnectionId);
      const game = new Game(gameId, async () => {
        const messages = await poll();
        if (messages.length > 0) {
          logger.info(`Process game messages`, messages);
        }
        return messages;
      });
      try {
        await game.run();
      } catch (error) {
        logger.error(`Unexpected error from game`, gameId, error);
      }
      logger.info(`End of the game`, gameId, invokerConnectionId);
    }
  });
};
