export interface ITileCore {
  i: number; // owner user index
  v: number; // click value
  l: number; // tile level
}

export const tileCoreEquals = (a: ITileCore, b: ITileCore): boolean =>
  a.i === b.i && a.v === b.v && a.l === b.l;

export const tileCoreClone = (a: ITileCore): ITileCore =>
  ({i: a.i, v: a.v, l: a.l});

export interface ITile extends ITileCore {
  growingTimer: number;
}

export interface IPos {
  x: number;
  y: number;
}

export type TileChange = ITile & IPos;

export type TileSync = ITileCore & IPos;

export const noOwnerIndex = -1;

export const emptyTile = (): ITile => ({
  i: noOwnerIndex,
  v: 0,
  l: 0,
  growingTimer: 0,
});

export const baseTile = (userIndex): ITile => ({
  ...emptyTile(),
  i: userIndex,
  v: 1,
  l: 1,
});

const defaultChangingTile: ITile = {
  i: noOwnerIndex,
  v: 0,
  l: 0,
  growingTimer: 0,
};

export const newChangingTile = (change: Partial<ITile>): ITile => ({...defaultChangingTile, ...change});

export const newTileChange = (change: IPos & Partial<ITile>): TileChange => ({ ...defaultChangingTile, ...change  });

export const updateTile = (tile: ITile, change: ITile): ITile => {
  const {value: newValue, owner: newOwner} = updateValueAndOwner(tile.v, change.v, tile.i, change.i);
  const newLevel = updateLevel(tile.l, change.l, tile.i, newOwner);
  const newGrowingTimer = updateGrowingTimer(tile.growingTimer, change.growingTimer, tile.i, newOwner);
  return {
    i: newOwner,
    v: newValue,
    l: newLevel,
    growingTimer: newGrowingTimer,
  }
};

const updateValueAndOwner = (oldValue: number, changingValue: number, oldOwner: number, changingOwner: number): { value: number; owner: number } => {
  if (oldOwner === noOwnerIndex) {
    return {value: changingValue, owner: changingOwner};
  } else if (oldOwner === changingOwner) {
    return {value: oldValue + changingValue, owner: oldOwner};
  } else {
    if (oldValue > changingValue) {
      return {value: oldValue - changingValue, owner: oldOwner};
    } else if (oldValue < changingValue) {
      return {value: changingValue - oldValue, owner: changingOwner};
    } else {
      return {value: 0, owner: noOwnerIndex};
    }
  }
};

const updateLevel = (oldLevel: number, changingLevel: number, oldOwner: number, newOwner: number): number => {
  if (oldOwner === newOwner) {
    return oldLevel + changingLevel;
  } else {
    return 0;
  }
};

const updateGrowingTimer = (oldGrowingTimer: number, changingGrowingTimer: number, oldOwner: number, newOwner: number): number => {
  if (oldOwner === newOwner) {
    return oldGrowingTimer + changingGrowingTimer;
  } else {
    return 0;
  }
};
