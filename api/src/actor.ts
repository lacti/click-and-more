import { ActorSystem } from "@yingyeothon/actor-system";
import {
  handleActorLambdaEvent,
  IActorLambdaEvent,
  shiftToNextLambda
} from "@yingyeothon/actor-system-aws-lambda-support";
import { RedisLock, RedisQueue } from "@yingyeothon/actor-system-redis-support";
import mem from "mem";
import { Game } from "./game";
import logger from "./logger";
import { Request } from "./message";
import { getRedis } from "./redis";
import { capturePromise } from "./xray";

const getActorSystem = mem(
  () =>
    new ActorSystem({
      queue: new RedisQueue({ redis: getRedis(), logger }),
      lock: new RedisLock({ redis: getRedis(), logger }),
      logger
    })
);

const getActor = mem((gameId: string) => {
  const game = new Game(gameId);
  return getActorSystem().spawn<Request>(gameId, actor =>
    actor
      .on("beforeAct", game.onLoad)
      .on("afterAct", game.onStore)
      .on("act", ({ message: request }) => game.onRequest(request))
      .on("error", error => logger.error(`ActorError`, gameId, error))
      .on(
        "shift",
        shiftToNextLambda({ functionName: process.env.BOTTOM_HALF_LAMBDA })
      )
  );
});

const topHalfTimeout = 27 * 1000;
const bottomHalfTimeout = 890 * 1000;

export const requestToActor = (gameId: string, message: Request) =>
  capturePromise(
    `sendMessage-${message.type}`,
    getActor(gameId).send(message, { shiftTimeout: topHalfTimeout })
  );

export const bottomHalf = handleActorLambdaEvent<IActorLambdaEvent>({
  spawn: ({ actorName }) => getActor(actorName),
  functionTimeout: bottomHalfTimeout,
  logger
});
