import { APIGatewayProxyHandler } from "aws-lambda";
import { Lambda } from "aws-sdk";
import { IGameActorEvent } from "../shared/actorRequest";
import { defaultGameId } from "../shared/constants";
import redisKeys from "../shared/redisKeys";
import { encodeMessage } from "./support/encoder";
import env from "./support/env";
import { redisSend } from "./support/redis";

const expirationSeconds = 300;

export const handle: APIGatewayProxyHandler = async event => {
  const connectionId = event.requestContext.connectionId;

  // TODO Check the validity of origin or referer of HTTP request.
  console.debug(`Headers`, event.headers);

  // A client should send a "X-GAME-ID" via HTTP Header.
  // TODO This value can be set from the lobby service.
  const gameId = event.headers["x-game-id"] || defaultGameId();
  // if (!gameId) {
  //   console.warn(`Invalid gameId from connection`, connectionId);
  //   return { statusCode: 404, body: "Not Found" };
  // }

  // Do Redis works at one time.
  // 1) Auth if needed 2) Set (connectionId, gameId) 3) Post ENTER message.
  const redisResponse = await redisSend(
    [
      env.redisPassword ? [`AUTH`, env.redisPassword] : undefined,
      [
        `SETEX`,
        `"${redisKeys.connection(connectionId)}"`,
        expirationSeconds.toString(),
        gameId
      ],
      [
        `RPUSH`,
        `"${redisKeys.queue(gameId)}"`,
        encodeMessage({
          type: "enter",
          connectionId
        })
      ]
    ],
    m =>
      (env.redisPassword ? m.check("+OK\r\n") : m)
        .capture("\r\n")
        .capture("\r\n")
  );
  console.info(`Redis response`, redisResponse);

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
  console.info(`Game logged`, gameId, connectionId);
  return {
    statusCode: 200,
    body: "OK"
  };
};
