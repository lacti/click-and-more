import { BoardScore } from "../model";
import { broadcast } from "./support/broadcast";

export interface IEndBroadcast {
  type: "end";
  score: BoardScore;
}

export const broadcastEnd = (connectionIds: string[], score: BoardScore) =>
  broadcast<IEndBroadcast>(connectionIds, { type: "end", score });
