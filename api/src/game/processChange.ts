import {
  GameRequest,
  IGameOneTileClickRequest,
  IGameTwoTilesClickRequest
} from "../shared/gameRequest";
import { baseTile, Board, emptyTile, IGameUser } from "./model";
import { costs } from "./model/costs";
import { IValueMap } from "./model/valuemap";
import { NetworkSystem } from "./system/network";
import { BoardValidator } from "./system/validator";

interface IProcessEnv<R> {
  user: IGameUser;
  request: R;
  board: Board;
  boardValidator: BoardValidator;
  network: NetworkSystem;
}

const processMap: Partial<
  {
    [type in GameRequest["type"]]: (
      env: IProcessEnv<unknown>
    ) => Promise<any> | undefined;
  }
> = {
  new: processNew,
  defenceUp: processUpgradeDefence,
  offenceUp: processUpgradeOffence,
  productivityUp: processUpgradeProductivity,
  attackRangeUp: processUpgradeAttackRange,
  attack: processAttack
};

export default function processChange(
  env: IProcessEnv<GameRequest>
): Promise<any> | undefined {
  if (env.request.type in processMap) {
    return processMap[env.request.type](env);
  }
}

function processNew({
  user,
  request,
  board,
  boardValidator,
  network
}: IProcessEnv<IGameOneTileClickRequest>): Promise<any> | undefined {
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
  const cost =
    costs.newTile.base +
    costs.newTile.multiply *
      board
        .map(row => row.filter(tile => tile.i === user.index).length)
        .reduce((a, b) => a + b, 0);
  if (user.energy < cost) {
    return;
  }

  board[request.y][request.x] = baseTile(user.index);
  user.energy -= cost;
  return network.actOnTile(user, request.y, request.x);
}

function processUpgradeDefence(
  env: IProcessEnv<IGameOneTileClickRequest>
): Promise<any> | undefined {
  return processUpgradeOne({
    ...env,
    property: "defence"
  });
}

function processUpgradeOffence(
  env: IProcessEnv<IGameOneTileClickRequest>
): Promise<any> | undefined {
  return processUpgradeOne({
    ...env,
    property: "offence"
  });
}

function processUpgradeProductivity(
  env: IProcessEnv<IGameOneTileClickRequest>
): Promise<any> | undefined {
  return processUpgradeOne({
    ...env,
    property: "productivity"
  });
}

function processUpgradeAttackRange(
  env: IProcessEnv<IGameOneTileClickRequest>
): Promise<any> | undefined {
  return processUpgradeOne({
    ...env,
    property: "attackRange"
  });
}

function processUpgradeOne({
  user,
  request,
  board,
  boardValidator,
  network,
  property
}: IProcessEnv<IGameOneTileClickRequest> & {
  property: keyof IValueMap;
}): Promise<any> | undefined {
  if (!boardValidator.isMyTile({ i: user.index, y: request.y, x: request.x })) {
    return;
  }
  const tile = board[request.y][request.x];
  const cost =
    costs[property].base + (tile[property] - 1) * costs[property].multiply;
  if (user.energy < cost) {
    return;
  }

  tile[property]++;
  user.energy -= cost;
  return network.actOnTile(user, request.y, request.x);
}

function processAttack({
  user,
  request,
  board,
  boardValidator,
  network
}: IProcessEnv<IGameTwoTilesClickRequest>): Promise<any> | undefined {
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

  const damage = board[request.from.y][request.from.x].offence;
  const cost = costs.attack.base + costs.attack.multiply * distance * damage;
  if (user.energy < cost) {
    return;
  }

  const remainHp = board[request.to.y][request.to.x].defence - damage;
  user.energy -= cost;
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
  return network.attack(user, request.from, request.to, damage);
}
