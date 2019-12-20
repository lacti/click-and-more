import { emptyTile, ITile, TileChange, tileEquals, updateTile } from "./tile";
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

export const duplicateBoard = (board: Board) => [
  ...board.map(row => [...row])
];

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

export const diffBoards = (before: Board, after: Board): TileChange[] =>
  before
    .map((row, y) =>
      row
        .map((oldTile, x) =>
          tileEquals(oldTile, after[y][x])
            ? undefined
            : { ...after[y][x], y, x }
        )
        .filter(Boolean)
    )
    .reduce((a, b) => a.concat(b), [])
    .filter(Boolean);

export const calculateScore = (board: Board) => {
  const score: { [index: number]: { tile: number; power: number } } = {};
  board.forEach(row =>
    row
      .filter(tile => isValidUser(tile.i))
      .forEach(tile => {
        if (score[tile.i] === undefined) {
          score[tile.i] = { tile: 0, power: 0 };
        }
        ++score[tile.i].tile;
        score[tile.i].power += tile.v;
      })
  );
  return score;
};
