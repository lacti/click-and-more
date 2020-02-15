import {
  baseTile,
  emptyTile,
  IPos,
  ITile,
  TileChange,
  tileCoreClone,
  TileSync,
  updateTile
} from "./tile";
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

export const resetOwnedTiles = (board: Board, userIndex: number): Board => [
  ...board.map(row => [
    ...row.map(tile => (tile.i === userIndex ? emptyTile() : tile))
  ])
];

export const duplicateBoard = (board: Board) => board.map(row => [...row]);

const getUserPositions = (board: Board): { [userIndex: number]: IPos } => {
  const maxX = board[0].length - 1;
  const maxY = board.length - 1;
  return {
    1: { x: 0, y: 0 },
    2: { x: maxX, y: maxY },
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

export const applyChangesToBoard = (
  board: Board,
  changes: TileChange[]
): Board => {
  if (changes.length === 0) {
    return board;
  }
  const copiedBoard = duplicateBoard(board);
  changes.forEach(change => {
    copiedBoard[change.y][change.x] = updateTile(
      board[change.y][change.x],
      change
    );
  });
  return copiedBoard;
};

export const diffBoards = (
  before: Board,
  after: Board,
  equals: (a: ITile, b: ITile) => boolean
): TileSync[] =>
  before
    .map((row, y) =>
      row
        .map((oldTile, x) =>
          equals(oldTile, after[y][x])
            ? undefined
            : {
                ...tileCoreClone(after[y][x]),
                y,
                x,
                v: after[y][x].productivity // TODO Just for Test
              }
        )
        .filter(Boolean)
    )
    .reduce((a, b) => a.concat(b), [])
    .filter(Boolean);

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
