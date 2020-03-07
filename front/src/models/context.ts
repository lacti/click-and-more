import { ColorMap, Board, GameStage, GameScore, IPos } from "./domain";

export interface GameContext {
  me: number;
  colors: ColorMap;
  board: Board;

  stage: GameStage;
  age: number;
  energy: number;
  selected: IPos | null;

  score: GameScore;
}

export const newGameContext = (): GameContext => ({
  board: [],
  colors: {},
  me: -1,
  stage: GameStage.Wait,
  age: 0,
  energy: 0,
  selected: null,
  score: {}
});
