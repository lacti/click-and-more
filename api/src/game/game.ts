import { IGameMember } from "../shared/actorRequest";
import {
  GameRequest,
  IGameConnectionIdRequest,
  IGameEnterRequest
} from "../shared/gameRequest";
import logger from "./logger";
import {
  Board,
  IGameObserver,
  IGameUser,
  isEliminated,
  newBoard,
  placeUsersToBoard
} from "./model";
import {
  gameRunningSeconds,
  gameWaitSeconds,
  initialEnergy,
  loopInterval,
  minAgeToCheckIfEliminated
} from "./model/constraints";
import { GameStage } from "./model/stage";
import processChange from "./processChange";
import { dropConnection } from "./response/drop";
import env from "./support/env";
import sleep from "./support/sleep";
import Ticker from "./support/ticker";
import { getPlayerColor } from "./support/utils";
import { AiSystem } from "./system/ai";
import { EnergySystem } from "./system/energy";
import { NetworkSystem } from "./system/network";
import { BoardValidator } from "./system/validator";

// TODO How about choosing the size of board by the count of members?
const boardHeight = 5;
const boardWidth = 5;

export default class Game {
  private readonly users: IGameUser[];
  private readonly observers: IGameObserver[];
  private readonly connectedUsers: { [connectionId: string]: IGameUser } = {};
  private readonly board: Board;

  private readonly energySystem: EnergySystem;
  private readonly networkSystem: NetworkSystem;
  private readonly boardValidator: BoardValidator;
  private readonly ai: AiSystem;

  private lastMillis: number;
  private ticker: Ticker | null;

  constructor(
    private readonly gameId: string,
    members: IGameMember[],
    private readonly pollRequests: () => Promise<GameRequest[]>
  ) {
    this.board = newBoard(boardHeight, boardWidth);

    // Setup game context from members.
    this.users = members
      .filter(member => !member.observer)
      .map(
        (member, index): IGameUser => ({
          // userIndex should start from 1.
          index: index + 1,
          color: getPlayerColor(index),
          connectionId: "",
          load: false,
          memberId: member.memberId,

          energy: initialEnergy
        })
      );
    this.observers = members
      .filter(member => member.observer)
      .map(
        (member): IGameObserver => ({
          memberId: member.memberId,
          connectionId: ""
        })
      );

    // Initialize other systems.
    this.networkSystem = new NetworkSystem(
      this.users,
      this.observers,
      this.board
    );
    this.boardValidator = new BoardValidator(this.board);
    this.energySystem = new EnergySystem(this.users);
    this.ai = new AiSystem(this.board, this.boardValidator, this.users);
    if (this.ai.activated) {
      this.users.push(this.ai.user);
      this.connectedUsers[this.ai.user.connectionId] = this.ai.user;
    }
  }

  public run = async () => {
    try {
      await this.stageWait();
      if (Object.keys(this.connectedUsers).length > 0) {
        await this.stageRunning();
      }
    } catch (error) {
      logger.error(`Error in game logic`, error);
    }
    await this.stageEnd();
  };

  private stageWait = async () => {
    logger.info(`Game WAIT-stage`, this.gameId, this.users);

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
    logger.info(`Game RUNNING-stage`, this.gameId, this.users);

    this.lastMillis = Date.now();
    this.ticker = new Ticker(GameStage.Running, gameRunningSeconds * 1000);
    while (this.ticker.isAlive()) {
      const requests = await this.pollRequests();
      await this.processEnterLeaveLoad(requests);

      await this.processChanges(requests);
      await this.update();

      await this.ticker.checkAgeChanged(this.broadcastStage);
      await sleep(loopInterval);

      if (
        this.ticker.age > minAgeToCheckIfEliminated &&
        isEliminated(this.board) &&
        !env.isOffline
      ) {
        break;
      }
    }
  };

  private stageEnd = async () => {
    logger.info(`Game END-stage`, this.gameId);
    await this.networkSystem.end();
    await Promise.all(Object.keys(this.connectedUsers).map(dropConnection));
  };

  private processEnterLeaveLoad = async (requests: GameRequest[]) => {
    // TODO Error tolerance
    for (const request of requests) {
      try {
        switch (request.type) {
          case "enter":
            await this.onEnter(request);
            break;
          case "leave":
            this.onLeave(request);
            break;
          case "load":
            await this.onLoad(request);
            break;
        }
      } catch (error) {
        logger.error(`Error in request`, request, error);
      }
    }
  };

  private processChanges = async (requests: GameRequest[]) => {
    const promises: Array<Promise<void>> = [];
    for (const request of requests) {
      if (!this.isValidUser(request)) {
        continue;
      }
      const user = this.connectedUsers[request.connectionId];
      try {
        const maybe = processChange({
          request,
          user,
          board: this.board,
          boardValidator: this.boardValidator,
          network: this.networkSystem
        });
        if (maybe !== undefined) {
          promises.push(maybe);
        }
      } catch (error) {
        logger.error(`Error in processing change`, request, error);
      }
    }
    if (promises.length === 0) {
      return;
    }
    try {
      await Promise.all(promises);
    } catch (error) {
      logger.error(`Error in awaiting updates`, error);
    }
  };

  private update = async () => {
    const now = Date.now();
    const dt = (now - this.lastMillis) / 1000;
    this.lastMillis = now;

    return this.updateWithDt(dt);
  };

  private updateWithDt = async (dt: number) => {
    this.energySystem.update(dt, this.board);

    const aiRequest = this.ai.tryToDo(dt);
    if (aiRequest !== null) {
      await this.processEnterLeaveLoad([aiRequest]);
      await this.processChanges([aiRequest]);
    }
  };

  private isValidUser = ({ connectionId }: IGameConnectionIdRequest) =>
    this.connectedUsers[connectionId] !== undefined;

  private onEnter = ({ connectionId, memberId }: IGameEnterRequest) => {
    const newbie = this.users.find(u => u.memberId === memberId);
    const observer = this.observers.find(o => o.memberId === memberId);
    if (observer) {
      observer.connectionId = connectionId;
    } else if (newbie) {
      newbie.connectionId = connectionId;
      newbie.load = false;

      this.connectedUsers[connectionId] = newbie;
      return logHook(
        `Game newbie`,
        this.gameId,
        newbie,
        this.users
      )(this.networkSystem.newbie(newbie));
    }
  };

  private onLeave = ({ connectionId }: IGameConnectionIdRequest) => {
    const leaver = this.connectedUsers[connectionId];
    const observer = this.observers.find(o => o.connectionId === connectionId);

    if (observer) {
      observer.connectionId = "";
    } else if (leaver) {
      leaver.connectionId = "";
      leaver.load = false;
      delete this.connectedUsers[connectionId];

      // No reset for leaver because they can reconnect.
    }
  };

  private onLoad = ({ connectionId }: IGameConnectionIdRequest) => {
    const user = this.connectedUsers[connectionId];
    const observer = this.observers.find(o => o.connectionId === connectionId);
    if (observer) {
      return logHook(
        `Game load observer`,
        this.gameId,
        observer
      )(
        this.networkSystem.loadObserver(
          observer,
          this.ticker!.stage,
          this.ticker!.age
        )
      );
    } else if (user) {
      user.load = true;
      placeUsersToBoard(this.board, user.index);
      return logHook(
        `Game load`,
        this.gameId,
        connectionId,
        this.users
      )(this.networkSystem.load(user, this.ticker!.stage, this.ticker!.age));
    }
  };

  private broadcastStage = (stage: GameStage, age: number) =>
    logHook(
      `Game broadcast stage`,
      this.gameId,
      this.users,
      stage,
      age
    )(this.networkSystem.stage(stage, age));
}

const logHook = (...args: any[]) => {
  logger.debug(...args);
  return <T>(next: T) => next;
};
