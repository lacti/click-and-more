import { baseTile, emptyTile, IPos, ITile } from "./tile";
import { isValidUser } from "./user";

export type BoardRow = ITile[];
export type Board = BoardRow[];

export type BoardScore = ReturnType<typeof calculateScore>;

export const newBoard = (height: number, width: number) =>
  Array(height)
    .fill(0)
    .map(_1 =>
      Array(width)
        .fill(0)
        .map(_2 => emptyTile())
    );

const getUserPositions = (board: Board): { [userIndex: number]: IPos } => {
  const maxX = board[0].length - 1;
  const maxY = board.length - 1;
  return {
    1: { x: maxX, y: maxY },
    2: { x: 0, y: 0 },
    3: { x: 0, y: maxY },
    4: { x: maxX, y: 0 },
    5: { x: Math.floor(maxX / 2), y: 0 },
    6: { x: Math.floor(maxX / 2), y: maxY }
  };
};

export const placeUsersToBoard = (board: Board, userIndex: number) => {
  const userPositions = getUserPositions(board);
  const userPosition = userPositions[userIndex];
  if (userPosition) {
    board[userPosition.y][userPosition.x] = baseTile(userIndex);
  }
};

export const calculateScore = (board: Board) => {
  const score: { [index: number]: { tile: number } } = {};
  board.forEach(row =>
    row
      .filter(tile => isValidUser(tile.i))
      .forEach(tile => {
        if (score[tile.i] === undefined) {
          score[tile.i] = { tile: 0 };
        }
        ++score[tile.i].tile;
      })
  );
  return score;
};

export const isEliminated = (board: Board) =>
  new Set(board.flatMap(row => row.map(col => col.i)).filter(isValidUser))
    .size <= 1;
