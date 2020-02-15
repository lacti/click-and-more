import {
  baseValueMap,
  emptyValueMap,
  IValueMap,
  valueMapClone,
  valueMapEquals
} from "./valuemap";

export interface ITileCore extends IValueMap {
  i: number; // owner user index
}

export const tileCoreEquals = (a: ITileCore, b: ITileCore): boolean =>
  a.i === b.i && valueMapEquals(a, b);

export const tileCoreClone = (a: ITileCore): ITileCore => ({
  i: a.i,
  ...valueMapClone(a)
});

export type ITile = ITileCore;

export interface IPos {
  x: number;
  y: number;
}

export type TileChange = ITile & IPos;

export type TileSync = ITileCore & IPos;

export const noOwnerIndex = -1;

export const emptyTile = (): ITile => ({
  i: noOwnerIndex,
  ...emptyValueMap()
});

export const baseTile = (userIndex): ITile => ({
  ...emptyTile(),
  i: userIndex,
  ...baseValueMap()
});

const defaultChangingTile: ITile = {
  i: noOwnerIndex,
  ...emptyValueMap()
};

export const newChangingTile = (change: Partial<ITile>): ITile => ({
  ...defaultChangingTile,
  ...change
});

export const newTileChange = (change: IPos & Partial<ITile>): TileChange => ({
  ...defaultChangingTile,
  ...change
});

export const updateTile = (tile: ITile, change: ITile): ITile => {
  // TODO
  return {
    ...tile,
    i: change.i,
    productivity: tile.productivity + change.productivity
  };
};
