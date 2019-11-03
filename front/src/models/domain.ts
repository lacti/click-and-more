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

export type YxValue<V> = { [y: number]: { [x: number]: V } };
export type YxCount = YxValue<number>;
export type YxTile = YxValue<ITile>;
