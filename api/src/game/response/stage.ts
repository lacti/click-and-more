import { GameStage } from "../model/stage";
import { broadcast } from "./support/broadcast";

export interface IStageBroadcast {
  type: "stage";
  stage: GameStage;
  age: number;
}

export const broadcastStage = (
  connectionIds: string[],
  stage: GameStage,
  age: number
) => broadcast<IStageBroadcast>(connectionIds, { type: "stage", stage, age });
