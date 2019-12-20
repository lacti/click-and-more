import {
  GameRequest,
  IGameClickRequest,
  IGameConnectionIdRequest
} from "../shared/gameRequest";
import {
  applyChangesToBoard,
  Board,
  calculateScore,
  IGameUser,
  newBoard,
  placeUsersToBoard,
  resetOwnedTiles,
  TileChange
} from "./model";
import { GameStage } from "./model/stage";
import {
  broadcastEnd,
  broadcastLeaver,
  broadcastNewbie,
  broadcastStage,
  ClickBroadcast,
  replyLoad
} from "./response";
import sleep from "./support/sleep";
import Ticker from "./support/ticker";
import { getRandomColor } from "./support/utils";

const userCapacity = 4;

const boardHeight = 8;
const boardWidth = 8;

const gameWaitSeconds = 60;
const gameRunningSeconds = 30;
const loopInterval = 0;

export default class Game {
  public static readonly gameAliveSeconds: number =
    gameWaitSeconds + gameRunningSeconds;

  private userSerial: number = 0;
  private users: { [connectionId: string]: IGameUser } = {};
  private board: Board;

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

      if (Object.keys(this.users).length === userCapacity) {
        break;
      }

      await this.ticker.checkAgeChanged(this.broadcastStage);
      await sleep(loopInterval);
    }

    this.board = placeUsersToBoard(this.board, Object.values(this.users).map(x => x.index))
  };

  private stageRunning = async () => {
    console.info(`Game RUNNING-stage`, this.gameId, this.users);

    this.ticker = new Ticker(GameStage.Running, gameRunningSeconds * 1000);
    while (this.ticker.isAlive()) {
      const requests = await this.pollRequests();
      await this.processEnterLeaveLoad(requests);

      this.processChanges(requests);
      this.broadcastClick();

      await this.ticker.checkAgeChanged(this.broadcastStage);
      await sleep(loopInterval);
    }
  };

  private stageEnd = async () => {
    console.info(`Game END-stage`, this.gameId);
    await broadcastEnd(Object.keys(this.users), calculateScore(this.board));

    // TODO disconnect all user connections.
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

  private processChanges = (requests: GameRequest[]) => {
    const changes = requests
      .filter(e => e.type === "click")
      .filter(this.isValidUser)
      .map(({ connectionId, data }: IGameClickRequest) =>
        data.map(
          ({ y, x, value }) =>
            ({
              i: this.users[connectionId].index,
              v: value,
              y,
              x
            } as TileChange)
        )
      )
      .reduce((a, b) => a.concat(b), []);
    if (changes.length > 0) {
      logHook(`Game apply changes`, this.gameId, changes.length);
      this.board = applyChangesToBoard(this.board, changes);
    }
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
