import {Board, ITile, noOwnerIndex, updateTile} from "../model";


const getDegradationFactor = () => 1;
const getSelfGrowingFactor = tileLevel => tileLevel;


export const updateGrowing = (board: Board, dt: number): Board => {
  return board.map(row => row.map(tile => updateTileSelf(tile, dt)));
};


const updateTileSelf = (tile: ITile, dt: number): ITile => {
  if (tile.i === noOwnerIndex) {
    return tile;
  } else {
    return updateTile(tile, getSelfChange(tile, dt));
  }
};

const getSelfChange = (tile: ITile, dt: number): ITile => {
  if (tile.l === 0) {
    return {
      i: noOwnerIndex,
      v: getDegradationFactor() * dt,
      l: 0,
    };
  } else {
    return {
      i: tile.i,
      v: getSelfGrowingFactor(tile.l) * dt,
      l: 0,
    };
  }
};
