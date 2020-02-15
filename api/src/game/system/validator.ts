import { Board } from "../model/board";
import { IPos, ITileOwnership, noOwnerIndex } from "../model/tile";

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

  public isNearbyMyTile = ({ y, x, i }: IOwnedPos) => {
    if (!this.validateYx(y, x)) {
      return false;
    }
    const nearBy = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ]
      .map(([dy, dx]) => [y + dy, x + dx])
      .filter(([ny, nx]) => this.validateYx(ny, nx))
      .some(([ny, nx]) => this.board[ny][nx].i === i);
    return nearBy;
  };
}
