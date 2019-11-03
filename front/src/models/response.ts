import { IUser, Board, TileChange, GameStage, GameScore } from "./domain";

export interface IEnterBroadcast {
  type: "enter";
  newbie: IUser;
}

export interface ILeaveBroadcast {
  type: "leave";
  leaver: IUser;
}

export interface ILoadResponse {
  type: "load";
  me: IUser;
  users: IUser[];
  board: Board;
  stage: GameStage;
  age: number;
}

export interface IClickBroadcast {
  type: "click";
  changes: TileChange[];
}

export interface IStageBroadcsat {
  type: "stage";
  stage: GameStage;
  age: number;
}

export interface IEndBroadcast {
  type: "end";
  score: GameScore;
}

export type GameResponse =
  | IEnterBroadcast
  | ILeaveBroadcast
  | ILoadResponse
  | IClickBroadcast
  | IStageBroadcsat
  | IEndBroadcast;
