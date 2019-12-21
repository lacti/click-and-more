import { boardHeight, boardWidth } from "./constraints";
import { emptyTile, IPos, ITile, TileChange, updateTile } from "./tile";
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
    2: { x: 0, y: maxY },
    3: { x: maxX, y: 0 },
    4: { x: maxX, y: maxY }
  };
};

export const placeUsersToBoard = (
  board: Board,
  userIndices: number[]
): Board => {
  const userPositions = getUserPositions(board);

  const copiedBoard = duplicateBoard(board);
  userIndices.forEach(userIndex => {
    const userPosition = userPositions[userIndex];
    copiedBoard[userPosition.y][userPosition.x] = {
      i: userIndex,
      v: 0,
      l: 1
    };
  });
  return copiedBoard;
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
): TileChange[] =>
  before
    .map((row, y) =>
      row
        .map((oldTile, x) =>
          equals(oldTile, after[y][x]) ? undefined : { ...after[y][x], y, x }
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

export const withBoardValidator = (board: Board) => {
  const validateTileChange = ({ y, x, i }: TileChange) => {
    // If that tile is mine.
    if (board[y][x].i === i) {
      return true;
    }
    // Or that tile is near by my tile.
    const nearBy = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dy, dx]) => [y + dy, x + dx])
      .filter(
        ([ny, nx]) => ny >= 0 && ny < boardHeight && nx >= 0 && nx < boardWidth
      )
      .some(([ny, nx]) => board[ny][nx].i === i);
    return nearBy;
  };
  return { validateTileChange };
};
