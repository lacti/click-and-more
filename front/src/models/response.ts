import { IUser, Board, TileChange } from "./domain";

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
}

export interface IClickBroadcast {
  type: "click";
  values: TileChange[];
}

export interface IStageBroadcsat {
  type: "stage";
  stage: "wait" | "running" | "end";
  age: number;
}

export interface IEndBroadcast {
  type: "end";
  score: {
    [index: number]: {
      tile: number;
      power: number;
    };
  };
}

export type GameResponse =
  | IEnterBroadcast
  | ILeaveBroadcast
  | ILoadResponse
  | IClickBroadcast
  | IStageBroadcsat
  | IEndBroadcast;
