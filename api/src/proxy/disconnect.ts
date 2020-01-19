import actorRedisPush from "@yingyeothon/actor-system-redis-support/lib/queue/push";
import actorEnqueue from "@yingyeothon/actor-system/lib/actor/enqueue";
import { ConsoleLogger } from "@yingyeothon/logger";
import redisDel from "@yingyeothon/naive-redis/lib/del";
import redisGet from "@yingyeothon/naive-redis/lib/get";
import { APIGatewayProxyHandler } from "aws-lambda";
import actorSubsysKeys from "../shared/actorSubsysKeys";
import env from "./support/env";
import responses from "./support/responses";
import useRedis from "./support/useRedis";

const logger = new ConsoleLogger(`debug`);

export const handle: APIGatewayProxyHandler = async event => {
  // Read gameId related this connectionId.
  const { connectionId } = event.requestContext;
  return useRedis(async redisConnection => {
    const gameId: string | null = await redisGet(
      redisConnection,
      env.redisKeyPrefixOfConnectionIdAndGameID + connectionId
    );
    logger.info(`Game id`, connectionId, gameId);

    // Send a leave message to Redis Q and delete (gameId, connectionId).
    if (gameId) {
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
        { item: { type: "leave", connectionId } }
      );
      await redisDel(
        redisConnection,
        env.redisKeyPrefixOfConnectionIdAndGameID + connectionId
      );
    }

    logger.info(`Cleanup and game leaved`, connectionId, gameId);
    return responses.OK;
  });
};
