import { Board } from "./board";
import { IPos } from "./tile";
import { IValueMap } from "./valuemap";

export const costs = {
  newTile: {
    base: 15,
    multiply: 0
  },
  defence: {
    base: 5,
    multiply: 0
  },
  offence: {
    base: 20,
    multiply: 1
  },
  productivity: {
    base: 10,
    multiply: 1
  },
  attackRange: {
    base: 25,
    multiply: 5
  },
  attack: {
    base: 4,
    multiply: 1
  }
};

export type Costs = typeof costs;

export const calculateNewTileCost = ({
  userIndex,
  board
}: {
  userIndex: number;
  board: Board;
}) => {
  const cost =
    costs.newTile.base +
    costs.newTile.multiply *
      board
        .map(row => row.filter(tile => tile.i === userIndex).length)
        .reduce((a, b) => a + b, 0);
  return cost;
};

export const calculateUpgradeCost = ({
  y,
  x,
  board,
  property
}: {
  y: number;
  x: number;
  board: Board;
  property: keyof IValueMap;
}) => {
  const tile = board[y][x];
  const cost =
    costs[property].base + (tile[property] - 1) * costs[property].multiply;
  return cost;
};

export const calculateAttackCost = ({
  from,
  to,
  board
}: {
  from: IPos;
  to: IPos;
  board: Board;
}) => {
  const distance = Math.abs(to.y - from.y) + Math.abs(to.x - from.x);
  const damage = board[from.y][from.x].offence;
  const cost = costs.attack.base + costs.attack.multiply * distance * damage;
  return cost;
};
