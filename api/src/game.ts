import { RedisRepository } from "@yingyeothon/repository-redis";
import { ApiGatewayManagementApi } from "aws-sdk";
import mem from "mem";
import logger from "./logger";
import { IConnectionId, Request, Response } from "./message";
import { Board, ChangedTile, IUser } from "./model";
import { getRedis } from "./redis";

interface IGameUser extends IUser, IConnectionId {}

interface IGame {
  start: number;
  userSerial: number;
  users: IGameUser[];
  board: Board;
}

const noOwnerIndex = -1;

const newGame = (y: number, x: number): IGame => ({
  start: Date.now(),
  userSerial: 0,
  users: [],
  board: Array(y)
    .fill(0)
    .map(_ =>
      Array(x)
        .fill(0)
        .map(_2 => ({
          i: noOwnerIndex,
          v: 0
        }))
    )
});

const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * letters.length)];
  }
  return color;
};

const getRepository = mem(
  () =>
    new RedisRepository({
      redis: getRedis()
    })
);

const asRedisKey = (gameId: string) => `click-and-more/${gameId}`;
const defaultSize = { width: 20, height: 20 };

export class Game {
  private model: IGame;

  constructor(private readonly gameId: string) {}

  public onLoad = async () => {
    this.model =
      (await getRepository().get<IGame>(asRedisKey(this.gameId))) ||
      newGame(defaultSize.height, defaultSize.width);
    logger.info(`loadModel`, this.model);
  };

  public onStore = async () => {
    await getRepository().set(asRedisKey(this.gameId), this.model);
    logger.info(`storeModel`, this.model);
  };

  public onRequest = async (request: Request) => {
    logger.info(`beginOfRequest`, request, this.model.users, this.debugBoard());
    switch (request.type) {
      case "enter":
        const nextSerial = this.model.userSerial + 1;
        const newbie: IGameUser = {
          connectionId: request.connectionId,
          color: getRandomColor(),
          index: nextSerial
        };
        logger.info(`newbie`, newbie);

        this.model = {
          ...this.model,
          userSerial: nextSerial,
          users: [...this.model.users, newbie]
        };
        await Promise.all(
          this.model.users
            .filter(u => u.connectionId !== request.connectionId)
            .map(u =>
              getSender(u.connectionId)({
                type: "newbie",
                newbie
              })
            )
        );
        break;
      case "leave":
        const leaver = this.model.users.filter(
          u => u.connectionId === request.connectionId
        )[0];
        if (!leaver) {
          break;
        }
        this.model = {
          ...this.model,
          users: this.model.users.filter(
            u => u.connectionId !== request.connectionId
          )
        };
        await Promise.all(
          this.model.users
            .map(u => u.connectionId)
            .map(connectionId =>
              getSender(connectionId)({
                type: "leaved",
                leaver
              })
            )
        );
        break;
      case "load":
        const me = this.model.users.find(
          u => u.connectionId === request.connectionId
        );
        logger.info(`me`, me);
        if (!me) {
          break;
        }
        await getSender(request.connectionId)({
          type: "entered",
          board: this.model.board,
          me,
          users: this.model.users
        });
        break;
      case "click":
        const user = this.model.users.filter(
          u => u.connectionId === request.connectionId
        )[0];
        if (!user) {
          break;
        }
        const changed: ChangedTile[] = [];
        for (const { y, x, delta } of request.data) {
          const tile = this.model.board[y][x];
          const newValue =
            tile.i === noOwnerIndex
              ? delta
              : tile.i === user.index
              ? tile.v + delta
              : tile.v - delta;
          const newTile = {
            i: newValue > 0 ? tile.i : noOwnerIndex,
            v: newValue > 0 ? newValue : 0
          };
          changed.push({ ...newTile, y, x });
          this.model.board[y][x] = newTile;
        }
        await Promise.all(
          this.model.users
            .map(u => u.connectionId)
            .map(connectionId =>
              getSender(connectionId)({
                type: "clicked",
                values: changed
              })
            )
        );
        break;
    }
    logger.info(`endOfRequest`, request, this.model.users, this.debugBoard());
  };

  private debugBoard = () =>
    JSON.stringify(
      this.model.board.filter(row => row.filter(col => col.i !== noOwnerIndex))
    );
}

const apimgmt = new ApiGatewayManagementApi({
  endpoint: process.env.WS_ENDPOINT
});

const getSender = mem((connectionId: string) => (response: Response) =>
  apimgmt
    .postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify(response)
    })
    .promise()
);
