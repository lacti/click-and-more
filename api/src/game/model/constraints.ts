import env from "../support/env";

export const userCapacity = env.isOffline ? 1 : 6;

export const boardHeight = 11;
export const boardWidth = 11;

export const gameWaitSeconds = 30;
export const gameRunningSeconds = 60;
export const loopInterval = 0;
