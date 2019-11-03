export interface ITile {
  i: number;
  v: number;
}

export interface IPos {
  x: number;
  y: number;
}

export type TileChange = ITile & IPos;

export const tileEquals = (a: ITile, b: ITile) => a.i === b.i && a.v === b.v;

const noOwnerIndex = -1;

export const emptyTile = (): ITile => ({
  i: noOwnerIndex,
  v: 0
});

export const isEmptyTile = ({ i }: ITile) => i === noOwnerIndex;

export const updateTile = (tile: ITile, change: ITile): ITile => {
  if (isEmptyTile(tile)) {
    return { i: change.i, v: change.v };
  }
  if (tile.i === change.i) {
    return { i: change.i, v: tile.v + change.v };
  }

  const newValue = tile.v - change.v;
  if (newValue > 0) {
    return { i: tile.i, v: newValue };
  } else if (newValue < 0) {
    return { i: change.i, v: -newValue };
  }
  return emptyTile();
};
