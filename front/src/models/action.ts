import { GameResponse } from "../models";

export interface ServerResponseAction {
  type: "serverResponse";
  payload: GameResponse;
}

export interface GameRestartAction {
  type: "gameRestart";
}

export interface TileClickAction {
  type: "tileClick";
  y: number;
  x: number;
}

export interface UpgradeAction {
  type: "upgrade";
  y: number;
  x: number;
  property: "offenceUp" | "defenceUp" | "attackRangeUp" | "productivityUp";
}

export interface BuyNewTileAction {
  type: "buyNewTile";
  y: number;
  x: number;
}

export interface ActionMap {
  serverResponse: ServerResponseAction;
  gameRestart: GameRestartAction;
  tileClick: TileClickAction;
  upgrade: UpgradeAction;
  buyNewTile: BuyNewTileAction;
}

export type Action =
  | ServerResponseAction
  | TileClickAction
  | UpgradeAction
  | GameRestartAction
  | BuyNewTileAction;
