const keyPrefix = `click-and-more`;

export default {
  queue: (gameId: string) => `${keyPrefix}/q/${gameId}`,
  connection: (connectionId: string) => `${keyPrefix}/conn/${connectionId}`,
  lock: (gameId: string) => `${keyPrefix}/lock/${gameId}`
};
