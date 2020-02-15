import { IPos } from "../model";
import { broadcast } from "./support/broadcast";

export interface IAttackBroadcast {
  type: "attack";
  from: IPos;
  to: IPos;
  value: number;
}

export const broadcastAttacked = (
  connectionIds: string[],
  from: IPos,
  to: IPos,
  damaged: number
) =>
  broadcast<IAttackBroadcast>(connectionIds, {
    type: "attack",
    from,
    to,
    value: damaged
  });
