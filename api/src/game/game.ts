import { IGameMember } from "../shared/actorRequest";
import { oneTileActions, twoTilesActions } from "../shared/clientRequest";
import {
  GameRequest,
  IGameConnectionIdRequest,
  IGameEnterRequest,
  IGameOneTileClickRequest,
  IGameTwoTilesClickRequest
} from "../shared/gameRequest";
import logger from "./logger";
import {
  applyChangesToBoard,
  Board,
  calculateScore,
  IGameUser,
  isEliminated,
  newBoard,
  newTileChange,
  placeUsersToBoard,
  withBoardValidator
} from "./model";
import {
  gameRunningSeconds,
  gameWaitSeconds,
  loopInterval,
  minAgeToCheckIfEliminated
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
import { EnergySystem } from "./system/energy";

// TODO How about choosing the size of board by the count of members?
const boardHeight = 5;
const boardWidth = 5;

const initialEnergy = 20;

export default class Game {
  private readonly users: IGameUser[];
  private connectedUsers: { [connectionId: string]: IGameUser } = {};
  private board: Board;
  private lastMillis: number;

  private readonly clickBroadcast: ClickBroadcast;
  private ticker: Ticker | null;

  private energySystem: EnergySystem;

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

      this.processChanges(requests);
      this.update();
      this.sendEnergy();
      this.broadcastClick();

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
    await broadcastEnd(
      Object.keys(this.connectedUsers),
      calculateScore(this.board)
    );
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

  private requestAsIndexForm = ({
    x,
    y,
    connectionId
  }: {
    x: number;
    y: number;
    connectionId: string;
  }) => ({
    i: this.connectedUsers[connectionId].index,
    y,
    x
  });

  private processChanges = (requests: GameRequest[]) => {
    try {
      const {
        validateTileNew,
        validateTileUpgrade,
        isTileMine,
        isTileYours
      } = withBoardValidator(this.board);

      // TODO DESTROY EVERYTHING
      const tileChanges = requests
        .filter(e => oneTileActions.includes(e.type))
        .filter(this.isValidUser)
        .map((request: IGameOneTileClickRequest) => ({
          ...this.requestAsIndexForm(request),
          ...request
        }))
        .filter(request =>
          request.type === "new"
            ? validateTileNew(request)
            : validateTileUpgrade(request)
        )
        .map(({ type, i, x, y }) =>
          newTileChange({
            i,
            y,
            x,
            defence: type === "defenceUp" ? 1 : undefined,
            offence: type === "offenceUp" ? 1 : undefined,
            productivity: type === "productivityUp" ? 1 : undefined,
            attackRange: type === "attackRangeUp" ? 1 : undefined
          })
        );

      const attacks = requests
        .filter(e => twoTilesActions.includes(e.type))
        .filter(this.isValidUser)
        .map((request: IGameTwoTilesClickRequest) => ({
          ...this.requestAsIndexForm({
            connectionId: request.connectionId,
            ...request.from
          }),
          ...request
        }))
        .filter(
          request =>
            isTileMine(request) && isTileYours({ i: request.i, ...request.to })
        )
        .map(({ connectionId, from, to }: IGameTwoTilesClickRequest) =>
          newTileChange({
            i: this.connectedUsers[connectionId].index,
            offence: this.board[from.y][from.x].offence, // TODO
            y: to.y,
            x: to.x
          })
        );
      const changes = [...tileChanges, ...attacks];
      if (changes.length > 0) {
        logHook(`Game apply changes`, this.gameId, JSON.stringify(changes));
        this.board = applyChangesToBoard(this.board, changes);
      }
    } catch (error) {
      logger.error(`Error in processing changes`, requests, error);
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

  private sendEnergy = () => {
    // TODO
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
  logger.debug(...args);
  return <T>(next: T) => next;
};
