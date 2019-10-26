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

export type ChangedTile = ITile & IPos;

export interface IUser {
  index: number;
  color: string;
}
