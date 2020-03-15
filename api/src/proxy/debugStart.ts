import lockRelease from "@yingyeothon/actor-system-redis-support/lib/lock/release";
import { APIGatewayProxyHandler } from "aws-lambda";
import { Lambda } from "aws-sdk";
import { IGameActorStartEvent } from "../shared/actorRequest";
import actorSubsysKeys from "../shared/actorSubsysKeys";
import { handleWithLogger } from "../shared/logger";
import env from "./support/env";
import responses from "./support/responses";
import useRedis from "./support/useRedis";

export const handle: APIGatewayProxyHandler = handleWithLogger({
  handlerName: "debugStart"
})(async ({ event, logger }) => {
  if (!env.isOffline) {
    return responses.NotFound;
  }

  const startEvent = JSON.parse(event.body) as IGameActorStartEvent;
  logger.updateSystemId(startEvent.gameId);
  logger.debug(`Start for debugging`, startEvent);

  await useRedis(async redisConnection =>
    lockRelease({
      connection: redisConnection,
      keyPrefix: actorSubsysKeys.lockKeyPrefix,
      logger
    }).release(startEvent.gameId)
  );
  logger.debug(`Release actor's lock`);

  // Start a new Lambda to process game messages.
  await new Lambda({
    endpoint: `http://localhost:3000`
  })
    .invoke({
      FunctionName: env.gameActorLambdaName,
      InvocationType: "Event",
      Qualifier: "$LATEST",
      Payload: JSON.stringify(startEvent)
    })
    .promise();
  return responses.OK;
});
