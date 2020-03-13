import { Board } from "../model/board";
import {
  IPos,
  ITile,
  ITileOwnership,
  noOwnerIndex,
  isMyTile,
  isEnemyTile
} from "../model/tile";

type IOwnedPos = IPos & ITileOwnership;

export class BoardValidator {
  private readonly boardHeight: number;
  private readonly boardWidth: number;

  constructor(private readonly board: Board) {
    this.boardHeight = board.length;
    this.boardWidth = board[0]?.length;
  }
  public validateYx = (y: number, x: number) =>
    y >= 0 && y < this.boardHeight && x >= 0 && x < this.boardWidth;

  public isMyTile = ({ y, x, i }: IOwnedPos) => {
    if (!this.validateYx(y, x)) {
      return false;
    }
    return this.board[y][x].i === i;
  };

  public isEnemyTile = ({ y, x, i }: IOwnedPos) => {
    if (!this.validateYx(y, x)) {
      return false;
    }
    return this.board[y][x].i !== i && this.board[y][x].i !== noOwnerIndex;
  };

  public isEmptyTile = ({ y, x }: IPos) => {
    if (!this.validateYx(y, x)) {
      return false;
    }
    return this.board[y][x].i === noOwnerIndex;
  };

  public findNearbyTiles = (
    { y, x }: IPos,
    filter: (tile: ITile) => boolean
  ) => {
    if (!this.validateYx(y, x)) {
      return [];
    }
    const nearBy = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ]
      .map(([dy, dx]) => [y + dy, x + dx])
      .filter(
        ([ny, nx]) => this.validateYx(ny, nx) && filter(this.board[ny][nx])
      )
      .map(([ny, nx]) => ({ y: ny, x: nx }));
    return nearBy;
  };

  public isNearbyTile = (pos: IPos, filter: (tile: ITile) => boolean) => {
    return this.findNearbyTiles(pos, filter).length > 0;
  };

  public isNearbyMyTile = ({ y, x, i }: IOwnedPos) => {
    return this.isNearbyTile({ y, x }, isMyTile(i));
  };

  public isNearbyEnemyTile = ({ y, x, i }: IOwnedPos) => {
    return this.isNearbyTile({ y, x }, isEnemyTile(i));
  };
}
