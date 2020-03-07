import {
  GameContext,
  GameResponse,
  EnterBroadcast,
  LeaveBroadcast,
  LoadResponse,
  StageBroadcsat,
  EndBroadcast,
  AttackBroadcast,
  TileChangedBroadcast,
  EnergyChangedResponse,
  GameResponseMap
} from "../../models";
import { ColorMap, GameStage } from "../../models";

const dispatch: {
  [T in keyof GameResponseMap]: (
    context: GameContext,
    message: GameResponseMap[T]
  ) => void;
} = {
  enter: onEnterBroadcast,
  leave: onLeaveBroadcast,
  load: onLoadResponse,
  stage: onStageBroadcast,
  end: onEndBroadcast,
  attack: onAttackBroadcast,
  changed: onTileChangedBroadcast,
  energy: onEnergyChangedResponse
};

export function applyResponseToGameContext(
  context: GameContext,
  response: GameResponse
) {
  dispatch[response.type](context, response as any);
}

function onEnterBroadcast(context: GameContext, { newbie }: EnterBroadcast) {
  context.colors[newbie.index] = newbie.color;
}

function onLeaveBroadcast(context: GameContext, { leaver }: LeaveBroadcast) {
  delete context.colors[leaver.index];
}

function onLoadResponse(
  context: GameContext,
  { age, board, users, me, stage, energy }: LoadResponse
) {
  context.age = age;
  context.board = board;
  context.colors = users
    .map(u => [u.index, u.color])
    .reduce(
      (obj, [index, color]) => Object.assign(obj, { [index]: color }),
      {} as ColorMap
    );
  context.me = me.index;
  context.stage = stage;
  context.energy = energy;
}

function onStageBroadcast(
  context: GameContext,
  { stage, age, energy }: StageBroadcsat
) {
  context.stage = stage;
  context.age = age;
  if (stage === GameStage.Running) {
    context.energy = energy;
  }
}

function onEndBroadcast(context: GameContext, { score }: EndBroadcast) {
  context.stage = GameStage.End;
  context.score = score;

  // TODO Why can't I receive the last age?
  if (context.age % 10 === 9) {
    ++context.age;
  }
}

function onAttackBroadcast(context: GameContext, attack: AttackBroadcast) {
  console.log(context, attack);
}

function onTileChangedBroadcast(
  context: GameContext,
  { data }: TileChangedBroadcast
) {
  for (const tile of data) {
    context.board[tile.y][tile.x] = { ...tile };
  }
}

function onEnergyChangedResponse(
  context: GameContext,
  { value }: EnergyChangedResponse
) {
  context.energy = value;
}
