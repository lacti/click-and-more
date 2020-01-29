import { IGameMember } from "../shared/actorRequest";
import {
  GameRequest,
  IGameClickRequest,
  IGameConnectionIdRequest,
  IGameEnterRequest,
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
  withBoardValidator
} from "./model";
import {
  gameRunningSeconds,
  gameWaitSeconds,
  loopInterval
} from "./model/constraints";
import { GameStage } from "./model/stage";
import {
  broadcastEnd,
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

// TODO How about choosing the size of board by the count of members?
const boardHeight = 5;
const boardWidth = 5;

export default class Game {
  private readonly users: IGameUser[];
  private connectedUsers: { [connectionId: string]: IGameUser } = {};
  private board: Board;
  private lastMillis: number;

  private readonly clickBroadcast: ClickBroadcast;
  private ticker: Ticker | null;

  constructor(
    private readonly gameId: string,
    members: IGameMember[],
    private readonly pollRequests: () => Promise<GameRequest[]>
  ) {
    this.board = newBoard(boardHeight, boardWidth);
    this.clickBroadcast = new ClickBroadcast(this.board);

    // Setup game context from members.
    this.users = members.map(
      (member, index): IGameUser => ({
        index: index + 1,
        color: getRandomColor(),
        connectionId: "",
        load: false,
        memberId: member.memberId
      })
    );
  }

  public run = async () => {
    await this.stageWait();
    if (Object.keys(this.connectedUsers).length > 0) {
      await this.stageRunning();
    }
    await this.stageEnd();
  };

  private stageWait = async () => {
    console.info(`Game WAIT-stage`, this.gameId, this.users);

    this.ticker = new Ticker(GameStage.Wait, gameWaitSeconds * 1000);
    while (this.ticker.isAlive()) {
      const requests = await this.pollRequests();
      await this.processEnterLeaveLoad(requests);

      if (Object.keys(this.connectedUsers).length === this.users.length) {
        break;
      }

      await this.ticker.checkAgeChanged(this.broadcastStage);
      await sleep(loopInterval);
    }
  };

  private stageRunning = async () => {
    console.info(`Game RUNNING-stage`, this.gameId, this.users);

    this.lastMillis = Date.now();
    this.ticker = new Ticker(GameStage.Running, gameRunningSeconds * 1000);
    while (this.ticker.isAlive()) {
      const requests = await this.pollRequests();
      await this.processEnterLeaveLoad(requests);

      this.processChanges(requests);
      this.update();
      this.broadcastClick();

      await this.ticker.checkAgeChanged(this.broadcastStage);
      await sleep(loopInterval);
    }
  };

  private stageEnd = async () => {
    console.info(`Game END-stage`, this.gameId);
    await broadcastEnd(
      Object.keys(this.connectedUsers),
      calculateScore(this.board)
    );
    await Promise.all(Object.keys(this.connectedUsers).map(dropConnection));
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
            this.onLeave(request);
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
    const { validateTileChange } = withBoardValidator(this.board);
    const clickChanges = requests
      .filter(e => e.type === "click")
      .filter(this.isValidUser)
      .map(({ connectionId, data }: IGameClickRequest) =>
        data.map(({ y, x, value }) =>
          newTileChange({
            i: this.connectedUsers[connectionId].index,
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
            i: this.connectedUsers[connectionId].index,
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
    this.connectedUsers[connectionId] !== undefined;

  private onEnter = ({ connectionId, memberId }: IGameEnterRequest) => {
    const newbie = this.users.find(u => u.memberId === memberId);
    newbie.connectionId = connectionId;
    newbie.load = false;

    this.connectedUsers[connectionId] = newbie;
    return logHook(
      `Game newbie`,
      this.gameId,
      newbie,
      this.users
    )(
      broadcastNewbie(
        Object.keys(this.connectedUsers).filter(each => each !== connectionId),
        newbie
      )
    );
  };

  private onLeave = ({ connectionId }: IGameConnectionIdRequest) => {
    const leaver = this.connectedUsers[connectionId];
    leaver.connectionId = "";
    leaver.load = false;
    delete this.connectedUsers[connectionId];

    // No reset for leaver because they can reconnect.
  };

  private onLoad = ({ connectionId }: IGameConnectionIdRequest) => {
    const user = this.connectedUsers[connectionId];
    user.load = true;
    this.board = placeUsersToBoard(this.board, user.index);
    return logHook(
      `Game load`,
      this.gameId,
      connectionId,
      this.users
    )(
      replyLoad(
        connectionId,
        this.users,
        this.board,
        this.ticker!.stage,
        this.ticker!.age
      )
    );
  };

  private broadcastClick = () =>
    this.clickBroadcast.broadcast({
      newBoard: this.board,
      connectionIds: this.users.filter(u => u.load).map(u => u.connectionId)
    });

  private broadcastStage = (stage: GameStage, age: number) =>
    logHook(
      `Game broadcast stage`,
      this.gameId,
      this.users,
      stage,
      age
    )(broadcastStage(Object.keys(this.connectedUsers), stage, age));
}

const logHook = (...args: any[]) => {
  console.info(...args);
  return <T>(next: T) => next;
};
