import { Board, gameUserToUser, IGameUser, IUser } from "../model";
import { Costs, costs } from "../model/costs";
import { GameStage } from "../model/stage";
import { reply } from "./support/reply";

interface ILoadResponse {
  type: "load";
  me: IUser;
  users: IUser[];
  board: Board;

  stage: GameStage;
  age: number;
  energy: number;
  costs: Costs;
}

export const replyLoad = (
  connectionId: string,
  users: IGameUser[],
  board: Board,
  stage: GameStage,
  age: number,
  energy: number,
  observer: boolean
) => {
  const replier = reply(connectionId);
  return replier<ILoadResponse>({
    type: "load",
    me: observer
      ? { color: "#000000", index: -2 }
      : gameUserToUser(users.find(u => u.connectionId === connectionId)),
    users: users.map(gameUserToUser),
    board,
    stage,
    age,
    energy: Math.floor(energy),
    costs
  });
};
