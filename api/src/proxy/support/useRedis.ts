import redisConnect, {
  IRedisConnection
} from "@yingyeothon/naive-redis/lib/connection";
import env from "./env";

export default async function useRedis<R>(
  work: (connection: IRedisConnection) => Promise<R>
): Promise<R> {
  const redisConnection = redisConnect({
    host: env.redisHost,
    password: env.redisPassword
  });
  try {
    const result = await work(redisConnection);
    return result;
  } finally {
    redisConnection.socket.disconnect();
  }
}
