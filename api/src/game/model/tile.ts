export interface ITileCore {
  i: number; // owner user index
  v: number; // click value
  l: number; // tile level
  p: boolean; // level up possible
}

export const tileCoreEquals = (a: ITileCore, b: ITileCore): boolean =>
  a.i === b.i && a.v === b.v && a.l === b.l && a.p === b.p;

export const tileCoreClone = (a: ITileCore): ITileCore =>
  ({i: a.i, v: a.v, l: a.l, p: a.p});

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
  p: false,
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
  p: null, // unused
  growingTimer: 0,
};

export const newChangingTile = (change: Partial<ITile>): ITile => ({...defaultChangingTile, ...change});

export const newTileChange = (change: IPos & Partial<ITile>): TileChange => ({ ...defaultChangingTile, ...change  });

export const updateTile = (tile: ITile, change: ITile): ITile => {
  const {value: newValue, owner: newOwner} = updateValueAndOwner(tile.v, change.v, tile.i, change.i);
  const newLevel = updateLevel(tile.l, change.l, tile.i, newOwner);
  const newLevelUpPossible = updateLevelUpPossible(newLevel, newValue);
  const newGrowingTimer = updateGrowingTimer(tile.growingTimer, change.growingTimer, tile.i, newOwner);
  return {
    i: newOwner,
    v: newValue,
    l: newLevel,
    p: newLevelUpPossible,
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

const levelUpValueTable = {
  0: 10,
  1: 20,
  2: 40,
  3: 70,
  4: 110,
  5: 160,
  6: 220,
  7: 290,
  8: 370,
  9: 460,
  10: 560,
  11: 670,
  12: 790,
  13: 920,
  14: 1060,
  15: 1210,
  16: 1370,
  17: 1540,
  18: 1720,
  19: 1910,
  20: 2110,
  21: 2320,
  22: 2540,
  23: 2770,
  24: 3010,
  25: 3260,
  26: 3520,
  27: 3790,
  28: 4070,
  29: 4360,
  30: 4660,
};

const updateLevelUpPossible = (newLevel: number, newValue: number): boolean => {
  if (newLevel in levelUpValueTable) {
    return newValue >= levelUpValueTable[newLevel];
  } else {
    return false;
  }
};

const updateGrowingTimer = (oldGrowingTimer: number, changingGrowingTimer: number, oldOwner: number, newOwner: number): number => {
  if (oldOwner === newOwner) {
    return oldGrowingTimer + changingGrowingTimer;
  } else {
    return 0;
  }
};
