import redisConnect from "@yingyeothon/naive-redis/lib/connection";
import env from "./support/env";

const redisConnection = redisConnect({
  host: env.redisHost,
  password: env.redisPassword
});

export default redisConnection;
