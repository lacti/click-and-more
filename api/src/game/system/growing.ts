import { Board, ITile, newChangingTile, noOwnerIndex, updateTile } from "../model";


const getDegradationInterval = () => 1;
const getDegradationAmount = () => 1;
const getSelfGrowingInterval = () => 1;
const getSelfGrowingAmount = tileLevel => tileLevel;


export const updateGrowing = (board: Board, dt: number): Board => {
  return board.map(row => row.map(tile => updateTileSelf(tile, dt)));
};


const updateTileSelf = (tile: ITile, dt: number): ITile => {
  if (tile.i === noOwnerIndex) {
    return tile;
  } else {
    if (tile.l === 0) {
      return degrade(tile, dt);
    } else {
      return growSelf(tile, dt);
    }
  }
};

const degrade = (tile: ITile, dt: number): ITile => {
  const [multiple, remain] = processTimer(getDegradationInterval(), tile.growingTimer, dt);
  return updateTile(tile, newChangingTile({
    i: noOwnerIndex,
    v: getDegradationAmount() * multiple,
    growingTimer: remain - tile.growingTimer,
  }));
};

const growSelf = (tile: ITile, dt: number): ITile => {
  const [multiple, remain] = processTimer(getSelfGrowingInterval(), tile.growingTimer, dt);
  return updateTile(tile, newChangingTile({
    i: tile.i,
    v: getSelfGrowingAmount(tile.l) * multiple,
    growingTimer: remain - tile.growingTimer,
  }));
};

const processTimer = (interval: number, oldTimer: number, dt: number): [number, number] => {
  const newTimer = oldTimer + dt;
  const multiple = Math.floor(newTimer / interval);
  const remain = newTimer % interval;
  return [multiple, remain];
};
