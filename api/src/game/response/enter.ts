import { IUser } from "../model";
import { broadcast } from "./support/broadcast";

export interface IEnterBroadcast {
  type: "enter";
  newbie: IUser;
}

export const broadcastNewbie = (connectionIds: string[], newbie: IUser) =>
  broadcast<IEnterBroadcast>(connectionIds, { type: "enter", newbie });
