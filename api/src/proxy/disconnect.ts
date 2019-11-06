import { APIGatewayProxyHandler } from "aws-lambda";
import redisKeys from "../shared/redisKeys";
import { encodeMessage } from "./support/encoder";
import env from "./support/env";
import { redisSend } from "./support/redis";

export const handle: APIGatewayProxyHandler = async event => {
  // Read gameId related this connectionId.
  const connectionId = event.requestContext.connectionId;
  const [gameId] = await redisSend(
    [
      env.redisPassword ? `AUTH ${env.redisPassword}` : ``,
      `GET "${redisKeys.connection(connectionId)}"`
    ],
    /^\+OK\r\n(?:\$[0-9]+\r\n([0-9A-Za-z_\-]+)\r\n|\$-1\r\n)$/
  );

  // Send a leave message to Redis Q and delete (gameId, connectionId).
  await redisSend([
    gameId
      ? `RPUSH "${redisKeys.queue(gameId)}" "${encodeMessage({
          type: "leave",
          connectionId
        })}"`
      : ``,
    `DEL "${redisKeys.connection(connectionId)}"`
  ]);

  console.info(`Game leaved`, gameId, connectionId);
  return {
    statusCode: 200,
    body: "OK"
  };
};
