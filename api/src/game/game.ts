import {
  GameRequest,
  IGameClickRequest,
  IGameConnectionIdRequest,
  IGameLevelUpRequest
} from "../shared/gameRequest";
import {
  applyChangesToBoard,
  Board,
  calculateScore,
  IGameUser,
  newBoard,
  newTileChange,
  placeUsersToBoard,
  resetOwnedTiles,
  withBoardValidator
} from "./model";
import {
  boardHeight,
  boardWidth,
  gameRunningSeconds,
  gameWaitSeconds,
  loopInterval,
  userCapacity
} from "./model/constraints";
import { GameStage } from "./model/stage";
import {
  broadcastEnd,
  broadcastLeaver,
  broadcastNewbie,
  broadcastStage,
  ClickBroadcast,
  replyLoad
} from "./response";
import { dropConnection } from "./response/drop";
import sleep from "./support/sleep";
import Ticker from "./support/ticker";
import { getRandomColor } from "./support/utils";
import { updateGrowing } from "./system/growing";

export default class Game {
  public static readonly gameAliveSeconds: number =
    gameWaitSeconds + gameRunningSeconds;

  private userSerial: number = 0;
  private users: { [connectionId: string]: IGameUser } = {};
  private board: Board;
  private lastMillis: number;

  private readonly clickBroadcast: ClickBroadcast;
  private ticker: Ticker | null;

  constructor(
    private readonly gameId: string,
    private readonly pollRequests: () => Promise<GameRequest[]>
  ) {
    this.board = newBoard(boardHeight, boardWidth);
    this.clickBroadcast = new ClickBroadcast(this.board);
  }

  public run = async () => {
    await this.stageWait();
    await this.stageRunning();
    await this.stageEnd();
  };

  private stageWait = async () => {
    console.info(`Game WAIT-stage`, this.gameId, this.users);

    // TODO Delete users if their sockets has been gone.
    this.ticker = new Ticker(GameStage.Wait, gameWaitSeconds * 1000);
    while (this.ticker.isAlive()) {
      const requests = await this.pollRequests();
      await this.processEnterLeaveLoad(requests);

      console.info(`Game WAIT-user`, Object.keys(this.users).length);
      if (Object.keys(this.users).length === userCapacity) {
        break;
      }

      await this.ticker.checkAgeChanged(this.broadcastStage);
      await sleep(loopInterval);
    }

    this.board = placeUsersToBoard(
      this.board,
      Object.values(this.users).map(x => x.index)
    );
  };

  private stageRunning = async () => {
    console.info(`Game RUNNING-stage`, this.gameId, this.users);

    this.lastMillis = Date.now();
    this.ticker = new Ticker(GameStage.Running, gameRunningSeconds * 1000);
    while (this.ticker.isAlive()) {
      const requests = await this.pollRequests();
      await this.processLeaveOnly(requests);

      this.processChanges(requests);
      this.update();
      this.broadcastClick();

      await this.ticker.checkAgeChanged(this.broadcastStage);
      await sleep(loopInterval);
    }
  };

  private stageEnd = async () => {
    console.info(`Game END-stage`, this.gameId);
    await broadcastEnd(Object.keys(this.users), calculateScore(this.board));

    await Promise.all(Object.keys(this.users).map(dropConnection));
    this.users = {};
  };

  private processEnterLeaveLoad = async (requests: GameRequest[]) => {
    // TODO Error tolerance
    for (const request of requests) {
      switch (request.type) {
        case "enter":
          await this.onEnter(request);
          break;
        case "leave":
          if (this.isValidUser(request)) {
            await this.onLeave(request);
          }
          break;
        case "load":
          if (this.isValidUser(request)) {
            await this.onLoad(request);
          }
          break;
      }
    }
  };

  private processLeaveOnly = async (requests: GameRequest[]) => {
    // TODO Error tolerance
    for (const request of requests) {
      switch (request.type) {
        case "leave":
          if (this.isValidUser(request)) {
            await this.onLeave(request);
          }
          break;
        default:
          console.warn(
            `Disconnect the user connecting after game starts`,
            request
          );
          await dropConnection(request.connectionId);
          break;
      }
    }
  };

  private processChanges = (requests: GameRequest[]) => {
    const { validateTileChange } = withBoardValidator(this.board);
    const clickChanges = requests
      .filter(e => e.type === "click")
      .filter(this.isValidUser)
      .map(({ connectionId, data }: IGameClickRequest) =>
        data.map(({ y, x, value }) =>
          newTileChange({
            i: this.users[connectionId].index,
            v: value,
            y,
            x
          })
        )
      )
      .reduce((a, b) => a.concat(b), [])
      .filter(validateTileChange);
    const levelUpChanges = requests
      .filter(e => e.type === "levelUp")
      .filter(this.isValidUser)
      .map(({ connectionId, data }: IGameLevelUpRequest) =>
        data.map(({ y, x, value }) =>
          newTileChange({
            i: this.users[connectionId].index,
            l: value,
            y,
            x
          })
        )
      )
      .reduce((a, b) => a.concat(b), [])
      .filter(validateTileChange);
    const changes = [...clickChanges, ...levelUpChanges];
    if (changes.length > 0) {
      logHook(`Game apply changes`, this.gameId, JSON.stringify(changes));
      this.board = applyChangesToBoard(this.board, changes);
    }
  };

  private update = () => {
    const now = Date.now();
    const dt = (now - this.lastMillis) / 1000;
    this.lastMillis = now;

    this.board = updateGrowing(this.board, dt);
  };

  private isValidUser = ({ connectionId }: IGameConnectionIdRequest) =>
    this.users[connectionId] !== undefined;

  private onEnter = ({ connectionId }: IGameConnectionIdRequest) => {
    // The index of user would start from 1.
    const index = ++this.userSerial;
    const newbie: IGameUser = {
      connectionId,
      color: getRandomColor(),
      index
    };
    this.users[newbie.connectionId] = newbie;
    return logHook(`Game newbie`, this.gameId, newbie, this.users)(
      broadcastNewbie(Object.keys(this.users), newbie)
    );
  };

  private onLeave = ({ connectionId }: IGameConnectionIdRequest) => {
    const leaver = this.users[connectionId];
    delete this.users[connectionId];

    this.board = resetOwnedTiles(this.board, leaver.index);
    return logHook(`Game leaver`, this.gameId, leaver, this.users)(
      broadcastLeaver(Object.keys(this.users), leaver)
    );
  };

  private onLoad = ({ connectionId }: IGameConnectionIdRequest) =>
    logHook(`Game load`, this.gameId, connectionId, this.users)(
      replyLoad(
        connectionId,
        Object.values(this.users),
        this.board,
        this.ticker!.stage,
        this.ticker!.age
      )
    );

  private broadcastClick = () =>
    this.clickBroadcast.broadcast({
      newBoard: this.board,
      connectionIds: Object.keys(this.users)
    });

  private broadcastStage = (stage: GameStage, age: number) =>
    logHook(`Game broadcast stage`, this.gameId, this.users, stage, age)(
      broadcastStage(Object.keys(this.users), stage, age)
    );
}

const logHook = (...args: any[]) => {
  console.info(...args);
  return <T>(next: T) => next;
};
