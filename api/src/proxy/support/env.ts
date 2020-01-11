export default {
  redisHost: process.env.REDIS_HOST!,
  redisPassword: process.env.REDIS_PASSWORD,
  gameActorLambdaName: process.env.GAME_ACTOR_LAMBDA_NAME!,
  isOffline: !!process.env.IS_OFFLINE,
  connectionGameIdPrefix: "click-and-more/gameId/"
};
