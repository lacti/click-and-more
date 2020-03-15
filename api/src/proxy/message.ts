import actorRedisPush from "@yingyeothon/actor-system-redis-support/lib/queue/push";
import actorEnqueue from "@yingyeothon/actor-system/lib/actor/enqueue";
import redisConnect from "@yingyeothon/naive-redis/lib/connection";
import redisGet from "@yingyeothon/naive-redis/lib/get";
import { APIGatewayProxyHandler } from "aws-lambda";
import actorSubsysKeys from "../shared/actorSubsysKeys";
import { ClientRequest, validateClientRequest } from "../shared/clientRequest";
import { handleWithLogger } from "../shared/logger";
import env from "./support/env";
import responses from "./support/responses";

const redisConnection = redisConnect({
  host: env.redisHost,
  password: env.redisPassword
});

export const handle: APIGatewayProxyHandler = handleWithLogger({
  handlerName: "message"
})(async ({ event, logger }) => {
  const connectionId = event.requestContext.connectionId;

  // Parse and validate a message from the client.
  let request: ClientRequest | undefined;
  try {
    request = JSON.parse(event.body) as ClientRequest;
    if (!validateClientRequest(request)) {
      throw new Error(`Invalid message: [${event.body}]`);
    }
  } catch (error) {
    logger.error(`Invalid message`, connectionId, request, error);
    return responses.NotFound;
  }

  // Read gameId related this connectionId.
  const gameId: string | null = await redisGet(
    redisConnection,
    env.redisKeyPrefixOfConnectionIdAndGameID + connectionId
  );
  logger.updateSystemId(gameId);

  logger.info(`Game id`, connectionId);
  if (!gameId) {
    logger.error(`No GameID for connection[${connectionId}]`);
    return responses.NotFound;
  }

  // Encode a game message and send it to Redis Q.
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
    { item: { ...request, connectionId } }
  );
  logger.info(`Game message sent`, connectionId, request);
  return responses.OK;
});
