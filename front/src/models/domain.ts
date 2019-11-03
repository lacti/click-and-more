export interface ITile {
  i: number;
  v: number;
}

export type BoardRow = ITile[];
export type Board = BoardRow[];
export interface IPos {
  x: number;
  y: number;
}

export type TileChange = ITile & IPos;
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
    power: number;
  };
}

export type YxValue<V> = { [y: number]: { [x: number]: V } };
export type YxCount = YxValue<number>;
export type YxTile = YxValue<ITile>;
