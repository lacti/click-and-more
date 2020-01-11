import actorRedisPush from "@yingyeothon/actor-system-redis-support/lib/queue/push";
import actorEnqueue from "@yingyeothon/actor-system/lib/actor/enqueue";
import { ConsoleLogger } from "@yingyeothon/logger";
import redisConnect from "@yingyeothon/naive-redis/lib/connection";
import redisDel from "@yingyeothon/naive-redis/lib/del";
import redisGet from "@yingyeothon/naive-redis/lib/get";
import { APIGatewayProxyHandler } from "aws-lambda";
import env from "./support/env";

export const handle: APIGatewayProxyHandler = async event => {
  // Read gameId related this connectionId.
  const connectionId = event.requestContext.connectionId;

  const logger = new ConsoleLogger(`debug`);
  const redisConnection = redisConnect({
    host: env.redisHost,
    password: env.redisPassword
  });
  try {
    const gameId: string | null = await redisGet(
      redisConnection,
      env.connectionGameIdPrefix + connectionId
    );
    console.info(`Game id`, connectionId, gameId);

    // Send a leave message to Redis Q and delete (gameId, connectionId).
    if (gameId) {
      await actorEnqueue(
        {
          id: gameId,
          queue: actorRedisPush({ connection: redisConnection, logger }),
          logger
        },
        { item: { type: "leave", connectionId } }
      );
      await redisDel(
        redisConnection,
        env.connectionGameIdPrefix + connectionId
      );
    }

    console.info(`Cleanup and game leaved`, connectionId, gameId);
    return {
      statusCode: 200,
      body: "OK"
    };
  } finally {
    redisConnection.socket.disconnect();
  }
};
