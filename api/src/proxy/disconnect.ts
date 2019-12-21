import { APIGatewayProxyHandler } from "aws-lambda";
import redisKeys from "../shared/redisKeys";
import { encodeMessage } from "./support/encoder";
import env from "./support/env";
import { redisSend } from "./support/redis";

export const handle: APIGatewayProxyHandler = async event => {
  // Read gameId related this connectionId.
  const connectionId = event.requestContext.connectionId;
  const response = await redisSend(
    [
      env.redisPassword ? [`AUTH`, env.redisPassword] : undefined,
      [`GET`, `"${redisKeys.connection(connectionId)}"`]
    ],
    m =>
      (env.redisPassword ? m.check("+OK\r\n") : m)
        .capture("\r\n") // length
        .capture("\r\n") // gameId
  );
  console.info(`Redis response`, response);

  const gameId = response.slice(-1)[0];
  console.info(`Game id`, connectionId, gameId);

  // Send a leave message to Redis Q and delete (gameId, connectionId).
  const deleteResponse = await redisSend(
    [
      gameId
        ? [
            `RPUSH`,
            `"${redisKeys.queue(gameId)}"`,
            encodeMessage({
              type: "leave",
              connectionId
            })
          ]
        : undefined,
      [`DEL`, `"${redisKeys.connection(connectionId)}"`]
    ],
    m => (gameId ? m.capture("\r\n") : m).capture("\r\n")
  );
  console.info(`Cleanup redis context`, connectionId, deleteResponse);

  console.info(`Game leaved`, connectionId, gameId);
  return {
    statusCode: 200,
    body: "OK"
  };
};
