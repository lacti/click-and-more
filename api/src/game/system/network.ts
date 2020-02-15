import { Board, calculateScore, IPos, TileSync } from "../model";
import { GameStage } from "../model/stage";
import { IGameUser } from "../model/user";
import {
  broadcastEnd,
  broadcastNewbie,
  broadcastTileChanged,
  replyEnergy,
  replyLoad,
  replyStage
} from "../response";
import { broadcastAttacked } from "../response/attack";
import { IRespondResult } from "../response/support/broadcast";

export class NetworkSystem {
  constructor(
    private readonly users: IGameUser[],
    private readonly board: Board
  ) {}

  public get connectionIds() {
    return this.users.map(u => u.connectionId).filter(Boolean);
  }

  public end = () =>
    broadcastEnd(this.connectionIds, calculateScore(this.board));

  public changed = (data: TileSync[]) =>
    data.length === 0
      ? Promise.resolve({} as IRespondResult)
      : broadcastTileChanged(this.connectionIds, data);

  public allUserTiles = (user: IGameUser) =>
    this.changed(
      this.board
        .map((row, y) =>
          row
            .map(
              (tile, x) =>
                ({
                  y,
                  x,
                  ...tile
                } as TileSync)
            )
            .filter(tile => tile.i === user.index)
        )
        .reduce((a, b) => a.concat(b), [] as TileSync[])
    );

  public newbie = (newbie: IGameUser) =>
    broadcastNewbie(
      this.connectionIds.filter(id => id !== newbie.connectionId),
      { index: newbie.index, color: newbie.color }
    ).then(() => this.allUserTiles(newbie));

  public load = (user: IGameUser, stage: GameStage, age: number) =>
    replyLoad(
      user.connectionId,
      this.users,
      this.board,
      stage,
      age,
      user.energy
    ).then(() => this.allUserTiles(user));

  public stage = (stage: GameStage, age: number) =>
    Promise.all(
      this.users
        .filter(u => u.connectionId.length > 0)
        .map(u => replyStage(u.connectionId, stage, age, u.energy))
    );

  public energy = (user: IGameUser) =>
    replyEnergy(user.connectionId, user.energy);

  public actOnTile = (user: IGameUser, y: number, x: number) =>
    Promise.all([
      this.changed([{ ...this.board[y][x], y, x }]),
      this.energy(user)
    ]);

  public attack = (user: IGameUser, from: IPos, to: IPos, damage: number) =>
    Promise.all([
      this.changed([{ ...this.board[to.y][to.x], y: to.y, x: to.x }]),
      this.energy(user),
      broadcastAttacked(this.connectionIds, from, to, damage)
    ]);
}
