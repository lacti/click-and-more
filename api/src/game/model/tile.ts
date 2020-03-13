import { baseValueMap, emptyValueMap, IValueMap } from "./valuemap";

export interface ITileOwnership {
  i: number; // owner user index
}

export interface ITile extends IValueMap, ITileOwnership {}

export interface IPos {
  x: number;
  y: number;
}

export type TileSync = ITile & IPos;

export const noOwnerIndex = -1;

export const emptyTile = (): ITile => ({
  i: noOwnerIndex,
  ...emptyValueMap()
});

export const baseTile = (userIndex: number): ITile => ({
  ...emptyTile(),
  i: userIndex,
  ...baseValueMap()
});

export const isEnemyTile = (userIndex: number) => (tile: ITile) =>
  tile.i !== userIndex && tile.i !== noOwnerIndex;

export const isMyTile = (userIndex: number) => (tile: ITile) =>
  tile.i === userIndex;
