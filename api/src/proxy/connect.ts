import actorRedisPush from "@yingyeothon/actor-system-redis-support/lib/queue/push";
import actorEnqueue from "@yingyeothon/actor-system/lib/actor/enqueue";
import redisGet from "@yingyeothon/naive-redis/lib/get";
import redisSet from "@yingyeothon/naive-redis/lib/set";
import { APIGatewayProxyHandler } from "aws-lambda";
import { loadActorStartEvent } from "../shared/actorRequest";
import actorSubsysKeys from "../shared/actorSubsysKeys";
import { handleWithLogger } from "../shared/logger";
import env from "./support/env";
import responses from "./support/responses";
import useRedis from "./support/useRedis";

const expirationMillis = 900 * 1000;

export const handle: APIGatewayProxyHandler = handleWithLogger({
  handlerName: "connect"
})(async ({ event, logger }) => {
  const { connectionId } = event.requestContext;

  const getParameter = (key: string) =>
    event.headers[key] ?? (event.queryStringParameters ?? {})[key];
  const response = await useRedis(async redisConnection => {
    // A client should send a "X-GAME-ID" via HTTP Header.
    const gameId = getParameter("x-game-id");
    const memberId = getParameter("x-member-id");

    // Validate starting information.
    if (!gameId || !memberId) {
      logger.error(`Invalid gameId from connection`, connectionId);
      return responses.NotFound;
    }
    logger.updateSystemId(gameId);

    const startEvent = await loadActorStartEvent({
      gameId,
      get: key => redisGet(redisConnection, key)
    });
    if (startEvent === null) {
      logger.error(`Invalid game context from gameId`);
      return responses.NotFound;
    }
    if (startEvent.members.every(m => m.memberId !== memberId)) {
      logger.error(`Not registered member`, startEvent, memberId);
      return responses.NotFound;
    }

    // Register connection and start a game.
    await redisSet(
      redisConnection,
      env.redisKeyPrefixOfConnectionIdAndGameID + connectionId,
      gameId,
      { expirationMillis }
    );
    await actorEnqueue(
      {
        id: gameId,
        queue: actorRedisPush({
          connection: redisConnection,
          keyPrefix: actorSubsysKeys.queueKeyPrefix,
          logger
        }),
        logger
      },
      {
        item: {
          type: "enter",
          connectionId,
          memberId
        }
      }
    );
    logger.info(`Game logged`, connectionId);
    return responses.OK;
  });
  return response;
});
