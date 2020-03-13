import { GameRequest } from "../../shared/gameRequest";
import logger from "../logger";
import { Board, IGameUser, isEnemyTile } from "../model";
import { initialEnergy } from "../model/constraints";
import { calculateNewTileCost, calculateUpgradeCost } from "../model/costs";
import { FakeConnectionId } from "../response/support/reply";
import { Timer } from "../support/timer";
import { getPlayerColor } from "../support/utils";
import { BoardValidator } from "./validator";

enum AiStage {
  Enter,
  Load,
  Running
}

export class AiSystem {
  private readonly tickTimer: Timer;
  private readonly aiUser: IGameUser | null;

  private stage: AiStage = AiStage.Enter;

  constructor(
    private readonly board: Board,
    private readonly boardValidator: BoardValidator,
    users: IGameUser[],
    tickInterval: number = 0.5
  ) {
    this.tickTimer = new Timer(tickInterval);

    // Activate AI.
    if (users.length < 2) {
      this.aiUser = newAiUser(users);
      logger.info("AiSystem is activated");
    }
  }

  public get activated() {
    return this.aiUser !== null;
  }

  public get user() {
    return this.aiUser!;
  }

  public tryToDo = (dt: number): GameRequest | null =>
    this.activated && this.tickTimer.addDt(dt) >= 1 ? this.doSomething() : null;

  private doSomething = (): GameRequest => {
    if (this.board?.length === undefined || this.board.length === 0) {
      return null;
    }
    if (this.stage === AiStage.Enter) {
      this.stage = AiStage.Load;
      return {
        type: "enter",
        connectionId: this.aiUser.connectionId,
        memberId: this.aiUser.memberId
      };
    }
    if (this.stage === AiStage.Load) {
      this.stage = AiStage.Running;
      return {
        type: "load",
        connectionId: this.aiUser.connectionId
      };
    }

    logger.debug("AiSystem", "Ai turn!");
    const height = this.board.length;
    const width = this.board[0].length;
    let remainCount = height * width;
    let maxY = 0;
    let startX = 0;
    while (remainCount > 0) {
      for (let y = maxY; y >= 0; --y) {
        const x = startX + maxY - y;
        if (x >= width) {
          break;
        }
        --remainCount;

        const maybe = this.doTileAction(y, x);
        if (maybe !== null) {
          return maybe;
        }
      }
      if (maxY < height - 1) {
        ++maxY;
      } else {
        ++startX;
      }
    }
    return null;
  };

  private doTileAction = (y: number, x: number): GameRequest | null => {
    const ownedPos = { y, x, i: this.aiUser.index };

    // Step 1. Buy a new tile.
    if (
      this.boardValidator.isEmptyTile({ y, x }) &&
      this.boardValidator.isNearbyMyTile(ownedPos) &&
      calculateNewTileCost({
        userIndex: this.aiUser.index,
        board: this.board
      }) <= this.aiUser.energy
    ) {
      logger.info("AiSystem", "New a tile", { y, x });
      return {
        type: "new",
        connectionId: this.aiUser.connectionId,
        y,
        x
      };
    }

    // Step 2. Attack or upgrade defence.
    if (
      this.boardValidator.isMyTile(ownedPos) &&
      this.boardValidator.isNearbyEnemyTile(ownedPos)
    ) {
      const maybeEnemyPos = this.boardValidator.findNearbyTiles(
        { y, x },
        isEnemyTile(this.aiUser.index)
      )[0];
      if (maybeEnemyPos !== undefined) {
        if (this.dice(0.9)) {
          logger.info("AiSystem", "Attack", { y, x }, maybeEnemyPos);
          // Attack near enemy.
          return {
            type: "attack",
            connectionId: this.aiUser.connectionId,
            from: { y, x },
            to: maybeEnemyPos
          };
        } else if (
          calculateUpgradeCost({
            y,
            x,
            board: this.board,
            property: "defence"
          }) <= this.aiUser.energy
        ) {
          logger.info("AiSystem", "Upgrade defence", { y, x });
          return {
            type: "defenceUp",
            connectionId: this.aiUser.connectionId,
            y,
            x
          };
        }
      }
    }

    // Step 3. Upgrade productivity.
    if (
      this.dice(0.1) &&
      this.boardValidator.isMyTile(ownedPos) &&
      calculateUpgradeCost({
        y,
        x,
        board: this.board,
        property: "productivity"
      })
    ) {
      logger.info("AiSystem", "Upgrade productivity", { y, x });
      return {
        type: "productivityUp",
        connectionId: this.aiUser.connectionId,
        y,
        x
      };
    }
    return null;
  };

  private dice = (expect: number) => Math.random() < expect;
}

const newAiUser = (users: IGameUser[]): IGameUser => {
  const index = Math.max(...users.map(u => u.index)) + 1;
  return {
    index,
    color: getPlayerColor(users.length),
    connectionId: FakeConnectionId,
    load: true,
    memberId: "__AI_USER__",
    energy: initialEnergy
  };
};
