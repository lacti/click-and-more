import { IUser } from "../model";
import { broadcast } from "./support/broadcast";

export interface ILeaveBroadcast {
  type: "leave";
  leaver: IUser;
}

export const broadcastLeaver = (connectionIds: string[], leaver: IUser) =>
  broadcast<ILeaveBroadcast>(connectionIds, { type: "leave", leaver });
