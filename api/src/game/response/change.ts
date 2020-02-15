import { TileSync } from "../model";
import { broadcast } from "./support/broadcast";

export interface ITileChangedBroadcast {
  type: "changed";
  data: TileSync[];
}

export const broadcastTileChanged = (
  connectionIds: string[],
  data: TileSync[]
) => broadcast<ITileChangedBroadcast>(connectionIds, { type: "changed", data });
