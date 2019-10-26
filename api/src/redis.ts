import IORedis from "ioredis";
import mem from "mem";

export const getRedis = mem(() => {
  return new IORedis({
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD
  });
});
