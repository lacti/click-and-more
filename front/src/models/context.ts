import { ColorMap, Board } from "./domain";
import { IClickBroadcast, GameResponse } from "./response";
import { deleteKeyFromMap } from "../utils/collection";
import { changesAsMap } from "../utils/change";

export interface IContext {
  me: number;
  colors: ColorMap;
  board: Board;
}

export const updateContext = (
  { me, colors, board }: IContext,
  response: GameResponse
): IContext => ({
  me: updateMe(me, response),
  colors: updateColors(colors, response),
  board: updateBoard(board, response)
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
  if (response.values.length === 0) {
    return board;
  }
  const { ys, yxValues } = changesAsMap(response.values);
  return [
    ...board.map((row, y) =>
      ys.has(y) ? [...row.map((tile, x) => yxValues[y][x] || tile)] : row
    )
  ];
};
