import {
  IUser,
  Board,
  GameStage,
  GameScore,
  IPos,
  TileSync,
  Costs
} from "./domain";

export interface EnterBroadcast {
  type: "enter";
  newbie: IUser;
}

export interface LeaveBroadcast {
  type: "leave";
  leaver: IUser;
}

export interface LoadResponse {
  type: "load";
  me: IUser;
  users: IUser[];
  board: Board;

  stage: GameStage;
  age: number;
  energy: number;
  costs: Costs;
}

export interface StageBroadcsat {
  type: "stage";
  stage: GameStage;
  age: number;
  energy: number;
}

export interface EndBroadcast {
  type: "end";
  score: GameScore;
}

export interface AttackBroadcast {
  type: "attack";
  from: IPos;
  to: IPos;
  value: number;
}

export interface TileChangedBroadcast {
  type: "changed";
  data: TileSync[];
}

export interface EnergyChangedResponse {
  type: "energy";
  value: number;
}

export interface GameResponseMap {
  enter: EnterBroadcast;
  leave: LeaveBroadcast;
  load: LoadResponse;
  stage: StageBroadcsat;
  end: EndBroadcast;
  attack: AttackBroadcast;
  changed: TileChangedBroadcast;
  energy: EnergyChangedResponse;
}

export type GameResponse =
  | EnterBroadcast
  | LeaveBroadcast
  | LoadResponse
  | StageBroadcsat
  | EndBroadcast
  | AttackBroadcast
  | TileChangedBroadcast
  | EnergyChangedResponse;
