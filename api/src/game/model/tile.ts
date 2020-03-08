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
