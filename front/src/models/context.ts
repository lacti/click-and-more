import { ColorMap, Board, GameStage, GameScore } from "./domain";
import { IClickBroadcast, GameResponse } from "./response";
import { deleteKeyFromMap } from "../utils/collection";
import { changesAsMap } from "../utils/change";

export interface IContext {
  me: number;
  colors: ColorMap;
  board: Board;

  stage: GameStage;
  age: number;

  score: GameScore;
}

export const initialContext = (): IContext => ({
  board: [],
  colors: {},
  me: -1,
  stage: GameStage.Wait,
  age: 0,
  score: {}
});

export const updateContext = (
  { me, colors, board, stage, age, score }: IContext,
  response: GameResponse
): IContext => ({
  me: updateMe(me, response),
  colors: updateColors(colors, response),
  board: updateBoard(board, response),
  stage: updateStage(stage, response),
  age: updateAge(age, response),
  score: updateScore(score, response)
});

const updateMe = (me: number, response: GameResponse): number => {
  switch (response.type) {
    case "load":
      return response.me.index;
    default:
      return me;
  }
};

const updateColors = (colors: ColorMap, response: GameResponse): ColorMap => {
  switch (response.type) {
    case "load":
      return response.users
        .map(u => [u.index, u.color])
        .reduce(
          (obj, [index, color]) => Object.assign(obj, { [index]: color }),
          {} as ColorMap
        );
    case "enter":
      return { ...colors, [response.newbie.index]: response.newbie.color };
    case "leave":
      return deleteKeyFromMap(colors, response.leaver.index);
    default:
      return colors;
  }
};

const updateBoard = (board: Board, response: GameResponse): Board => {
  switch (response.type) {
    case "load":
      return response.board;
    case "click":
      return applyClicksOnBoard(board, response);
    default:
      return board;
  }
};

const applyClicksOnBoard = (board: Board, response: IClickBroadcast): Board => {
  if (response.changes.length === 0) {
    return board;
  }
  const { ys, yxValues } = changesAsMap(response.changes);
  return [
    ...board.map((row, y) =>
      ys.has(y) ? [...row.map((tile, x) => yxValues[y][x] || tile)] : row
    )
  ];
};

const updateStage = (stage: GameStage, response: GameResponse): GameStage => {
  switch (response.type) {
    case "load":
    case "stage":
      return response.stage;
    case "end":
      return GameStage.End;
    default:
      return stage;
  }
};

const updateAge = (age: number, response: GameResponse): number => {
  switch (response.type) {
    case "load":
    case "stage":
      return response.age;
    default:
      return age;
  }
};

const updateScore = (score: GameScore, response: GameResponse): GameScore => {
  switch (response.type) {
    case "end":
      return response.score;
    default:
      return score;
  }
};
