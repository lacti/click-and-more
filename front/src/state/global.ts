import { GameRequest, GameContext, newGameContext } from "../models";
import sleep from "../utils/sleep";

export enum GlobalStage {
  Initialized,
  LobbyWaiting,
  GameStarting,
  GameUserWaiting,
  GameRunning,
  GameEnd,
  GameError
}

interface GlobalStateValue {
  stage: GlobalStage;
  currentGameId: string | null;
  gameContext: GameContext;
}

interface GlobalStateMethod {
  send: (request: GameRequest) => void;
}

export interface GlobalState extends GlobalStateValue, GlobalStateMethod {}

const globalState: GlobalState = {
  stage: GlobalStage.Initialized,
  currentGameId: null,
  gameContext: newGameContext(),

  send: defaultRequestSender
};

export function updateGlobalState(partial: Partial<GlobalState>) {
  Object.assign(globalState, partial);
}

export function updateGlobalStage(stage: GlobalStage) {
  updateGlobalState({
    stage
  });
}

export function resetGameContext() {
  updateGlobalState({
    currentGameId: null,
    send: defaultRequestSender
  });
}

export function getGlobalStage() {
  return globalState.stage;
}

export function getCurrentGameContext() {
  return globalState.gameContext;
}

export function getGlobalStateValue<K extends keyof GlobalStateValue>(
  accessor: K
): GlobalStateValue[K] {
  return globalState[accessor];
}

export function workWithGlobalState<K extends keyof GlobalStateMethod, R>(
  accessor: K,
  work: (delegate: GlobalStateMethod[K]) => R
): R {
  return work(globalState[accessor]);
}

export async function waitGlobalStage(
  expected: GlobalStage,
  waitIntervalMillis: number = 100
) {
  while (globalState.stage !== expected) {
    await sleep(waitIntervalMillis);
  }
}

function defaultRequestSender(request: GameRequest) {
  console.warn(`There is no connection!`, request);
}
