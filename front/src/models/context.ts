import { ColorMap, Board, GameStage, GameScore, IPos, Costs } from "./domain";

export interface GameContext {
  me: number;
  colors: ColorMap;
  board: Board;

  stage: GameStage;
  age: number;
  energy: number;
  selected: IPos | null;

  score: GameScore;
  costs: Costs;
}

export const newGameContext = (): GameContext => ({
  board: [],
  colors: {},
  me: -1,
  stage: GameStage.Wait,
  age: 0,
  energy: 0,
  selected: null,
  score: {},
  costs: {
    newTile: {
      base: 15,
      multiply: 0
    },
    defence: {
      base: 5,
      multiply: 0
    },
    offence: {
      base: 20,
      multiply: 1
    },
    productivity: {
      base: 20,
      multiply: 1
    },
    attackRange: {
      base: 25,
      multiply: 5
    },
    attack: {
      base: 4,
      multiply: 1
    }
  }
});
