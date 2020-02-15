import { GameStage } from "../model/stage";
import { reply } from "./support/reply";

export interface IStageBroadcast {
  type: "stage";
  stage: GameStage;
  age: number;
  energy: number;
}

export const replyStage = (
  connectionId: string,
  stage: GameStage,
  age: number,
  energy: number
) => {
  const replier = reply(connectionId);
  return replier<IStageBroadcast>({
    type: "stage",
    stage,
    age,
    energy: Math.floor(energy)
  });
};
