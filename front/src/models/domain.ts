export interface IValueMap {
  defence: number;
  offence: number;
  productivity: number;
  attackRange: number;
}

export interface ITileOwnership {
  i: number; // owner user index
}

export interface ITile extends IValueMap, ITileOwnership {}

export type BoardRow = ITile[];
export type Board = BoardRow[];
export interface IPos {
  x: number;
  y: number;
}

export type TileSync = ITile & IPos;

export type ColorMap = { [index: number]: string };

export interface IUser {
  index: number;
  color: string;
}

export enum GameStage {
  Wait = "wait",
  Running = "running",
  End = "end"
}

export interface GameScore {
  [index: number]: {
    tile: number;
  };
}

export type YxValue<V> = { [y: number]: { [x: number]: V } };
export type YxCount = YxValue<number>;
export type YxTile = YxValue<ITile>;
