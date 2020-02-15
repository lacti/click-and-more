import { Board, calculateScore, IPos, TileSync } from "../model";
import { GameStage } from "../model/stage";
import { IGameUser, IUser } from "../model/user";
import {
  broadcastEnd,
  broadcastNewbie,
  broadcastTileChanged,
  replyEnergy,
  replyLoad,
  replyStage
} from "../response";
import { broadcastAttacked } from "../response/attack";

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

  public newbie = (newbie: IUser) =>
    broadcastNewbie(this.connectionIds, newbie);

  public load = (user: IGameUser, stage: GameStage, age: number) =>
    replyLoad(
      user.connectionId,
      this.users,
      this.board,
      stage,
      age,
      user.energy
    );

  public stage = (stage: GameStage, age: number) =>
    Promise.all(
      this.users
        .filter(u => u.connectionId.length > 0)
        .map(u => replyStage(u.connectionId, stage, age, u.energy))
    );

  public changed = (data: TileSync[]) =>
    broadcastTileChanged(this.connectionIds, data);

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
