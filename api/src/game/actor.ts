import actorEventLoop from "@yingyeothon/actor-system/lib/actor/eventLoop";
import redisDel from "@yingyeothon/naive-redis/lib/del";
import redisSet from "@yingyeothon/naive-redis/lib/set";
import { Handler } from "aws-lambda";
import readyCall from "../lobby/readyCall";
import {
  clearActorStartEvent,
  IGameActorStartEvent,
  saveActorStartEvent
} from "../shared/actorRequest";
import { GameRequest } from "../shared/gameRequest";
import { newLogger } from "../shared/logger";
import actorSubsys from "./actorSubsys";
import Game from "./game";
import { setLogger } from "./logger";
import { gameAliveSeconds } from "./model/constraints";
import redisConnection from "./redisConnection";

export const handle: Handler<IGameActorStartEvent, void> = async (
  event,
  context
) => {
  const logger = newLogger({
    handlerName: "game",
    lambdaId: context.awsRequestId
  });
  setLogger(logger);

  logger.debug(`Start a new game lambda`, event);

  const { gameId, members } = event;
  if (!gameId) {
    logger.error(`No gameId from payload`, event);
    return;
  }

  // First, store game context into Redis.
  await saveActorStartEvent({
    event,
    set: (key, value) =>
      redisSet(redisConnection, key, value, {
        expirationMillis: gameAliveSeconds * 1000
      })
  });

  // Send the ready signal to the Lobby.
  if (event.callbackUrl !== undefined) {
    const response = await readyCall(event.callbackUrl);
    logger.debug(`Mark this game as ready`, response);
  }

  // Start the game loop.
  await actorEventLoop<GameRequest>({
    ...actorSubsys,
    id: gameId,
    loop: async poll => {
      logger.info(`Start a game with id`, gameId, members);
      const game = new Game(gameId, members, async () => {
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
      logger.info(`End of the game`, gameId, members);
      await clearActorStartEvent({
        gameId,
        del: key => redisDel(redisConnection, key)
      });
    }
  });

  // Flush all logs.
  await logger.flush();
};
