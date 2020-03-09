import {
  Action,
  ActionMap,
  ServerResponseAction,
  TileClickAction,
  UpgradeAction,
  BuyNewTileAction
} from "../models";
import sleep from "../utils/sleep";
import {
  GlobalStage,
  getCurrentGameContext,
  getGlobalStage,
  updateGlobalStage,
  workWithGlobalState
} from "./global";
import { applyResponseToGameContext } from "./reducers/context";

const q: Action[] = [];

export const enqueueAction = (action: Action) => q.push(action);

const dispatch: {
  [T in keyof ActionMap]: (action: ActionMap[T]) => void;
} = {
  serverResponse: onServerResponse,
  tileClick: onTileClick,
  upgrade: onUpgrade,
  gameRestart: onGameRestart,
  buyNewTile: onBuyNewTile
};

export default async function startProcessActionQueue() {
  while (true) {
    const action = q.shift();
    if (action === undefined) {
      // Reduce the CPU usage when a game is not running.
      const inputDelay = getGlobalStage() === GlobalStage.GameRunning ? 0 : 50;
      await sleep(inputDelay);
      continue;
    }

    dispatch[action.type](action as any);
  }
}

function onServerResponse({ payload }: ServerResponseAction) {
  applyResponseToGameContext(getCurrentGameContext(), payload);
}

function onTileClick({ y, x }: TileClickAction) {
  const ctx = getCurrentGameContext();

  const noOwnerIndex = -1;

  // Is it the first click?
  if (ctx.selected === null) {
    const selectedTile = ctx.board[y][x];
    // Is it my tile or empty?
    if (selectedTile.i === ctx.me || selectedTile.i === noOwnerIndex) {
      ctx.selected = { y, x };
    }
  } else {
    // Is it the second click?
    const currentTile = ctx.board[y][x];
    const previousTile = ctx.board[ctx.selected.y][ctx.selected.x];

    // Is it the same tile with previous one?
    if (
      ctx.selected.y === y &&
      ctx.selected.x === x &&
      currentTile.i === noOwnerIndex
    ) {
      workWithGlobalState("send", send =>
        send({
          type: "new",
          y: y,
          x: x
        })
      );
      ctx.selected = { y, x };
    } else if (
      previousTile.i === ctx.me &&
      currentTile.i !== ctx.me &&
      currentTile.i !== noOwnerIndex
    ) {
      // Is it the enemy tile when previous one is my tile?
      workWithGlobalState("send", send =>
        send({
          type: "attack",
          from: { y: ctx.selected!.y, x: ctx.selected!.x },
          to: { y, x }
        })
      );
      // Reset the cursor after attack.
      ctx.selected = null;
    } else {
      ctx.selected = { y, x };
    }
  }
}

function onUpgrade({ property, y, x }: UpgradeAction) {
  workWithGlobalState("send", send =>
    send({
      type: property,
      y: y,
      x: x
    })
  );
}

function onGameRestart() {
  updateGlobalStage(GlobalStage.Initialized);
}

function onBuyNewTile({ y, x }: BuyNewTileAction) {
  workWithGlobalState("send", send =>
    send({
      type: "new",
      y: y,
      x: x
    })
  );
}
