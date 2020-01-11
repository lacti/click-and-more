import actorRedisPush from "@yingyeothon/actor-system-redis-support/lib/queue/push";
import actorEnqueue from "@yingyeothon/actor-system/lib/actor/enqueue";
import { ConsoleLogger } from "@yingyeothon/logger";
import redisConnect from "@yingyeothon/naive-redis/lib/connection";
import redisSet from "@yingyeothon/naive-redis/lib/set";
import { APIGatewayProxyHandler } from "aws-lambda";
import { Lambda } from "aws-sdk";
import { IGameActorEvent } from "../shared/actorRequest";
import { defaultGameId } from "../shared/constants";
import env from "./support/env";

export const expirationMillis = 900 * 1000;

export const handle: APIGatewayProxyHandler = async event => {
  const connectionId = event.requestContext.connectionId;

  const logger = new ConsoleLogger(`debug`);
  const redisConnection = redisConnect({
    host: env.redisHost,
    password: env.redisPassword
  });

  try {
    // TODO Check the validity of origin or referer of HTTP request.
    logger.debug(`Headers`, event.headers);

    // A client should send a "X-GAME-ID" via HTTP Header.
    // TODO This value can be set from the lobby service.
    const gameId = event.headers["x-game-id"] || defaultGameId();
    // if (!gameId) {
    //   console.warn(`Invalid gameId from connection`, connectionId);
    //   return { statusCode: 404, body: "Not Found" };
    // }

    await redisSet(
      redisConnection,
      env.connectionGameIdPrefix + connectionId,
      gameId,
      { expirationMillis }
    );
    await actorEnqueue(
      {
        id: gameId,
        queue: actorRedisPush({ connection: redisConnection, logger }),
        logger
      },
      {
        item: {
          type: "enter",
          connectionId
        }
      }
    );

    // Start a new Lambda to process game messages.
    await new Lambda({
      endpoint: env.isOffline ? `http://localhost:3000` : undefined
    })
      .invoke({
        FunctionName: env.gameActorLambdaName,
        InvocationType: "Event",
        Qualifier: "$LATEST",
        Payload: JSON.stringify({
          gameId,
          invokerConnectionId: connectionId
        } as IGameActorEvent)
      })
      .promise();
    logger.info(`Game logged`, gameId, connectionId);
    return {
      statusCode: 200,
      body: "OK"
    };
  } finally {
    redisConnection.socket.disconnect();
  }
};
