import { Board, gameUserToUser, IGameUser, IUser } from "../model";
import { GameStage } from "../model/stage";
import { reply } from "./support/reply";

interface ILoadResponse {
  type: "load";
  me: IUser;
  users: IUser[];
  board: Board;

  stage: GameStage;
  age: number;
}

export const replyLoad = (
  connectionId: string,
  users: IGameUser[],
  board: Board,
  stage: GameStage,
  age: number
) => {
  const replier = reply(connectionId);
  return replier<ILoadResponse>({
    type: "load",
    me: gameUserToUser(users.find(u => u.connectionId === connectionId)),
    users: users.map(gameUserToUser),
    board,
    stage,
    age
  });
};
