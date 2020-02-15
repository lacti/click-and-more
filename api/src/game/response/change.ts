import { TileSync } from "../model";

export interface ITileChangedBroadcast {
  type: "changed";
  data: TileSync[];
}
