import {
  GameRequest,
  IGameOneTileClickRequest,
  IGameTwoTilesClickRequest
} from "../shared/gameRequest";
import { baseTile, Board, emptyTile, IGameUser } from "./model";
import {
  costToAttack,
  costToBuyNewTile,
  costToUpgradeAttackRange,
  costToUpgradeDefence,
  costToUpgradeOffence,
  costToUpgradeProductivity
} from "./model/costs";
import { BoardValidator } from "./system/validator";

interface IProcessEnv<R> {
  user: IGameUser;
  request: R;
  board: Board;
  boardValidator: BoardValidator;
}

const processMap: Partial<
  {
    [type in GameRequest["type"]]: (env: IProcessEnv<unknown>) => void;
  }
> = {
  new: processNew,
  defenceUp: processUpgradeDefence,
  offenceUp: processUpgradeOffence,
  productivityUp: processUpgradeProductivity,
  attackRangeUp: processUpgradeAttackRange,
  attack: processAttack
};

export default function processChange(env: IProcessEnv<GameRequest>) {
  if (env.request.type in processMap) {
    processMap[env.request.type](env);
  }
}

function processNew({
  user,
  request,
  board,
  boardValidator
}: IProcessEnv<IGameOneTileClickRequest>) {
  if (
    !(
      boardValidator.isEmptyTile(request) &&
      boardValidator.isNearbyMyTile({
        i: user.index,
        y: request.y,
        x: request.x
      })
    )
  ) {
    return;
  }
  if (user.energy > costToBuyNewTile) {
    return;
  }

  board[request.y][request.x] = baseTile(user.index);
  user.energy -= costToBuyNewTile;
}

function processUpgradeDefence({
  user,
  request,
  board,
  boardValidator
}: IProcessEnv<IGameOneTileClickRequest>) {
  if (!boardValidator.isMyTile({ i: user.index, y: request.y, x: request.x })) {
    return;
  }
  if (user.energy > costToUpgradeDefence) {
    return;
  }

  board[request.y][request.x].defence++;
  user.energy -= costToUpgradeDefence;
}

function processUpgradeOffence({
  user,
  request,
  board,
  boardValidator
}: IProcessEnv<IGameOneTileClickRequest>) {
  if (!boardValidator.isMyTile({ i: user.index, y: request.y, x: request.x })) {
    return;
  }
  if (user.energy > costToUpgradeOffence) {
    return;
  }

  board[request.y][request.x].offence++;
  user.energy -= costToUpgradeOffence;
}

function processUpgradeProductivity({
  user,
  request,
  board,
  boardValidator
}: IProcessEnv<IGameOneTileClickRequest>) {
  if (!boardValidator.isMyTile({ i: user.index, y: request.y, x: request.x })) {
    return;
  }
  if (user.energy > costToUpgradeProductivity) {
    return;
  }

  board[request.y][request.x].productivity++;
  user.energy -= costToUpgradeProductivity;
}

function processUpgradeAttackRange({
  user,
  request,
  board,
  boardValidator
}: IProcessEnv<IGameOneTileClickRequest>) {
  if (!boardValidator.isMyTile({ i: user.index, y: request.y, x: request.x })) {
    return;
  }
  if (user.energy > costToUpgradeAttackRange) {
    return;
  }

  board[request.y][request.x].attackRange++;
  user.energy -= costToUpgradeAttackRange;
}

function processAttack({
  user,
  request,
  board,
  boardValidator
}: IProcessEnv<IGameTwoTilesClickRequest>) {
  if (
    !(
      boardValidator.isMyTile({
        i: user.index,
        y: request.from.y,
        x: request.from.x
      }) &&
      boardValidator.isEnemyTile({
        i: user.index,
        y: request.to.y,
        x: request.to.x
      })
    )
  ) {
    return;
  }
  const distance =
    Math.abs(request.to.y - request.from.y) +
    Math.abs(request.to.x - request.from.x);
  if (distance > board[request.from.y][request.from.x].attackRange) {
    return;
  }
  if (user.energy > costToAttack) {
    return;
  }

  const remainHp =
    board[request.to.y][request.to.x].defence -
    board[request.from.y][request.from.x].offence;
  user.energy -= costToUpgradeAttackRange;
  if (remainHp > 0) {
    board[request.to.y][request.to.x].defence = remainHp;
  } else {
    if (
      boardValidator.isNearbyMyTile({
        i: user.index,
        y: request.to.y,
        x: request.to.x
      })
    ) {
      board[request.to.y][request.to.x] = baseTile(user.index);
    } else {
      board[request.to.y][request.to.x] = emptyTile();
    }
  }
}
