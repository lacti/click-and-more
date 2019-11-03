import { Handler } from "aws-lambda";
import * as IORedis from "ioredis";
import mem from "mem";
import { IGameActorEvent } from "../shared/actorRequest";
import { GameRequest } from "../shared/gameRequest";
import redisKeys from "../shared/redisKeys";
import Game from "./game";
import env from "./support/env";

const getRedis = mem(
  () => new IORedis({ host: env.redisHost, password: env.redisPassword })
);

const lockAliveSeconds = Math.ceil(Game.gameAliveSeconds * 1.2);

export const handle: Handler<IGameActorEvent, void> = async event => {
  const { gameId, invokerConnectionId } = event;
  if (!gameId) {
    console.error(`No gameId from payload`, event);
    return;
  }

  if (!(await acquireActorLock(gameId, lockAliveSeconds))) {
    console.info(
      `Another actor is already running`,
      gameId,
      invokerConnectionId
    );
    return;
  }

  // Create a request supplier.
  const queueKey = redisKeys.queue(gameId);
  const pollRequests = async (): Promise<GameRequest[]> => {
    // Read messages from Redis Q.
    const messages: string[] = await getRedis().lrange(queueKey, 0, -1);
    if (!messages || messages.length === 0) {
      return [];
    }
    // Delete all those messages from Redis Q.
    await getRedis().ltrim(queueKey, messages.length, -1);
    const requests = messages.map(parseMessage).filter(Boolean);
    console.debug(`Redis read requests`, requests);
    return requests;
  };

  console.info(`Start a game with Id`, gameId, invokerConnectionId);
  const game = new Game(gameId, pollRequests);
  try {
    await game.run();
  } catch (error) {
    console.error(`Unexpected error from game`, gameId, error);
  }

  // Clear resources from Redis.
  await getRedis().del(queueKey);
  await releaseActorLock(gameId);
};

const acquireActorLock = (gameId: string, aliveSeconds: number) =>
  getRedis()
    .set(
      redisKeys.lock(gameId),
      Date.now().toString(),
      "EX",
      aliveSeconds,
      "NX"
    )
    .then(result => result === "OK");

const releaseActorLock = (gameId: string) =>
  getRedis().del(redisKeys.lock(gameId));

const parseMessage = (message: string) => {
  try {
    return JSON.parse(message) as GameRequest;
  } catch (error) {
    console.warn(`Invalid game message`, message);
  }
  return undefined;
};
