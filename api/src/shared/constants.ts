// export const defaultGameId = "84cc6767-67d7-4275-90ab-a039a2ac8cc1";
export const defaultGameId = () =>
  Math.floor(Date.now() / 1000 / 60).toString(16);
