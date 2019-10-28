import { RedisRepository } from "@yingyeothon/repository-redis";
import { ApiGatewayManagementApi } from "aws-sdk";
import mem from "mem";
import logger from "./logger";
import {
  IClickRequest,
  IConnectionId,
  IEnterRequest,
  ILeaveRequest,
  ILoadRequest,
  Request,
  Response
} from "./message";
import { Board, ChangedTile, IPos, ITile, IUser } from "./model";
import { getRedis } from "./redis";
import { captureAsync, capturePromise } from "./xray";

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

class Debouncer {
  private flushTimer: NodeJS.Timer | null = null;

  constructor(
    private readonly callback: () => Promise<any>,
    private readonly timeout: number
  ) {}

  public update = () => {
    if (this.flushTimer === null) {
      this.flushTimer = setTimeout(this.callback, this.timeout);
    }
  };

  public clear = () => {
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  };
}

export class Game {
  private model: IGame;

  private changedPoses: { [y: number]: /* x */ Set<number> } = {};
  private changedDebouncer: Debouncer;

  constructor(private readonly gameId: string) {
    this.changedDebouncer = new Debouncer(this.flushChanged, 100);
  }

  public onLoad = async () => {
    logger.info(`onLoad`);
    this.model =
      (await capturePromise(
        `loadFromRedis`,
        getRepository().get<IGame>(asRedisKey(this.gameId))
      )) || newGame(defaultSize.height, defaultSize.width);
    logger.info(`loadModel`);
  };

  public onStore = async () => {
    logger.info(`onStore`);
    if (Object.keys(this.changedPoses).length > 0) {
      logger.info(`flush before store`);
      await this.flushChanged();
    }
    await capturePromise(
      `storeToRedis`,
      getRepository().set(asRedisKey(this.gameId), this.model)
    );
    logger.info(`storeModel`);
  };

  public onRequest = async (request: Request) => {
    logger.info(`beginOfRequest`, request);
    await this.dispatchRequest(request);
    logger.info(`endOfRequest`, request);
  };

  private dispatchRequest = async (request: Request) => {
    switch (request.type) {
      case "enter":
        return captureAsync(`processEnter`, this.onEnterRequest)(request);
      case "leave":
        return captureAsync(`processLeave`, this.onLeaveRequest)(request);
      case "load":
        return captureAsync(`processLoad`, this.onLoadRequest)(request);
      case "click":
        return captureAsync(`processClick`, this.onClickRequest)(request);
    }
    return Promise.resolve();
  };

  private onEnterRequest = async (request: IEnterRequest) => {
    await this.flushChanged();
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
    logger.info(`before-broadcast-enter`);
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
    logger.info(`after-broadcast-enter`);
  };

  private onLeaveRequest = async (request: ILeaveRequest) => {
    const leaver = this.model.users.filter(
      u => u.connectionId === request.connectionId
    )[0];
    if (!leaver) {
      return;
    }
    this.model = {
      ...this.model,
      users: this.model.users.filter(
        u => u.connectionId !== request.connectionId
      )
    };
    this.model.board.forEach(row =>
      row.forEach(tile => {
        if (tile.i === leaver.index) {
          tile.i = noOwnerIndex;
          tile.v = 0;
        }
      })
    );
    await this.flushChanged();

    logger.info(`before-broadcast-leave`);
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
    logger.info(`after-broadcast-leave`);
  };

  private onLoadRequest = async (request: ILoadRequest) => {
    const me = this.model.users.find(
      u => u.connectionId === request.connectionId
    );
    logger.info(`me`, me);
    if (!me) {
      return;
    }
    await this.flushChanged();

    logger.info(`before-send-loaded`);
    await getSender(request.connectionId)({
      type: "entered",
      board: this.model.board,
      me,
      users: this.model.users
    });
    logger.info(`after-send-loaded`);
  };

  private onClickRequest = async (request: IClickRequest) => {
    const user = this.model.users.filter(
      u => u.connectionId === request.connectionId
    )[0];
    if (!user) {
      return;
    }
    const changed: ChangedTile[] = [];
    for (const { y, x, delta } of request.data) {
      const tile = this.model.board[y][x];
      const newTile = ((): ITile => {
        if (tile.i === noOwnerIndex) {
          return { i: user.index, v: delta };
        } else if (tile.i === user.index) {
          return { i: user.index, v: tile.v + delta };
        }
        const newValue = tile.v - delta;
        if (newValue > 0) {
          return { i: tile.i, v: newValue };
        } else if (newValue === 0) {
          return { i: noOwnerIndex, v: 0 };
        } else {
          return { i: user.index, v: -newValue };
        }
      })();
      changed.push({ ...newTile, y, x });
      this.model.board[y][x] = newTile;
    }
    this.enqueueChanged(changed);
  };

  private flushChanged = async () => {
    const poses = this.changedPoses;
    this.changedPoses = {};
    this.changedDebouncer.clear();

    const changed: ChangedTile[] = [];
    for (const y of Object.keys(poses)) {
      for (const x of poses[y]) {
        changed.push({ ...this.model.board[y][x], y: +y, x: +x });
      }
    }
    logger.debug(`changed`, JSON.stringify(changed));
    if (changed.length === 0) {
      return;
    }

    logger.info(`before-flush-changed`);
    await capturePromise(
      `broadcastChanged`,
      Promise.all(
        this.model.users
          .map(u => u.connectionId)
          .map(connectionId =>
            getSender(connectionId)({
              type: "clicked",
              values: changed
            }).catch(logger.error)
          )
      )
    );
    logger.info(`after-flush-changed`);
  };

  private enqueueChanged = async (poses: IPos[]) => {
    for (const { y, x } of poses) {
      if (!this.changedPoses[y]) {
        this.changedPoses[y] = new Set<number>();
      }
      this.changedPoses[y].add(x);
    }
    this.changedDebouncer.update();
  };
}

const apimgmt = new ApiGatewayManagementApi({
  endpoint: process.env.WS_ENDPOINT
});

const getSender = mem((connectionId: string) => (response: Response) =>
  capturePromise(
    `postToConnection`,
    apimgmt
      .postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(response)
      })
      .promise()
  )
);
