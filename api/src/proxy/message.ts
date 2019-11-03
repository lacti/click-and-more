import { APIGatewayProxyHandler } from "aws-lambda";
import { ClientRequest, validateClientRequest } from "../shared/clientRequest";
import redisKeys from "../shared/redisKeys";
import { encodeMessage } from "./support/encoder";
import env from "./support/env";
import { redisSend } from "./support/redis";

export const handle: APIGatewayProxyHandler = async event => {
  const connectionId = event.requestContext.connectionId;

  // Parse and validate a message from the client.
  let request: ClientRequest | undefined;
  try {
    request = JSON.parse(event.body) as ClientRequest;
    if (!validateClientRequest(request)) {
      throw new Error(`Invalid message: [${event.body}]`);
    }
  } catch (error) {
    console.warn(`Invalid message`, connectionId, request, error);
    return { statusCode: 404, body: "Not Found" };
  }

  // Read gameId related this connectionId.
  const [gameId] = await redisSend(
    [
      env.redisPassword ? `AUTH ${env.redisPassword}` : ``,
      `GET "${redisKeys.connection(connectionId)}"`
    ],
    /^\+OK\r\n(?:\$[0-9]+\r\n([0-9A-Za-z_\-]+)\r\n|\$-1\r\n)$/
  );
  if (!gameId) {
    console.warn(`No GameID for connection[${connectionId}]`);
    return { statusCode: 404, body: "Not Found" };
  }

  // Encode a game message and send it to Redis Q.
  await redisSend([
    `RPUSH "${redisKeys.queue(gameId)}" ${encodeMessage({
      ...request,
      connectionId
    })}`
  ]);

  console.info(`Game message sent`, gameId, connectionId, request);
  return {
    statusCode: 200,
    body: "OK"
  };
};
