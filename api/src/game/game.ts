import { IGameMember } from "../shared/actorRequest";
import {
  GameRequest,
  IGameConnectionIdRequest,
  IGameEnterRequest
} from "../shared/gameRequest";
import logger from "./logger";
import {
  Board,
  IGameUser,
  isEliminated,
  newBoard,
  placeUsersToBoard
} from "./model";
import {
  gameRunningSeconds,
  gameWaitSeconds,
  loopInterval,
  minAgeToCheckIfEliminated
} from "./model/constraints";
import { GameStage } from "./model/stage";
import processChange from "./processChange";
import { dropConnection } from "./response/drop";
import sleep from "./support/sleep";
import Ticker from "./support/ticker";
import { getRandomColor } from "./support/utils";
import { EnergySystem } from "./system/energy";
import { NetworkSystem } from "./system/network";
import { BoardValidator } from "./system/validator";

// TODO How about choosing the size of board by the count of members?
const boardHeight = 5;
const boardWidth = 5;

const initialEnergy = 20;

export default class Game {
  private readonly users: IGameUser[];
  private connectedUsers: { [connectionId: string]: IGameUser } = {};
  private board: Board;
  private lastMillis: number;

  private ticker: Ticker | null;

  private energySystem: EnergySystem;
  private networkSystem: NetworkSystem;
  private boardValidator: BoardValidator;

  constructor(
    private readonly gameId: string,
    members: IGameMember[],
    private readonly pollRequests: () => Promise<GameRequest[]>
  ) {
    this.board = newBoard(boardHeight, boardWidth);
    this.networkSystem = new NetworkSystem(this.users, this.board);
    this.boardValidator = new BoardValidator(this.board);

    // Setup game context from members.
    this.users = members.map(
      (member, index): IGameUser => ({
        // userIndex should start from 1.
        index: index + 1,
        color: getRandomColor(),
        connectionId: "",
        load: false,
        memberId: member.memberId,

        energy: initialEnergy
      })
    );
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

    this.energySystem = new EnergySystem(this.users);

    this.lastMillis = Date.now();
    this.ticker = new Ticker(GameStage.Running, gameRunningSeconds * 1000);
    while (this.ticker.isAlive()) {
      const requests = await this.pollRequests();
      await this.processEnterLeaveLoad(requests);

      await this.processChanges(requests);
      this.update();

      await this.ticker.checkAgeChanged(this.broadcastStage);
      await sleep(loopInterval);

      if (
        this.ticker.age > minAgeToCheckIfEliminated &&
        isEliminated(this.board)
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

  private update = () => {
    const now = Date.now();
    const dt = (now - this.lastMillis) / 1000;
    this.lastMillis = now;

    this.updateWithDt(dt);
  };

  private updateWithDt(dt: number) {
    this.energySystem.update(dt, this.board);
  }

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
    )(this.networkSystem.newbie(newbie));
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
    )(this.networkSystem.load(user, this.ticker!.stage, this.ticker!.age));
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
