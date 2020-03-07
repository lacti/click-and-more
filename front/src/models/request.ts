import { IPos } from "./domain";

export interface ILoadRequest {
  type: "load";
}

export interface IClientOneTileClickRequest extends IPos {
  type: "new" | "defenceUp" | "offenceUp" | "productivityUp" | "attackRangeUp";
  x: number;
  y: number;
}

export interface IClientTwoTilesClickRequest {
  type: "attack";
  from: IPos;
  to: IPos;
}

export type GameRequest =
  | ILoadRequest
  | IClientOneTileClickRequest
  | IClientTwoTilesClickRequest;
