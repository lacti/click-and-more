import { IPos } from "../model";

export interface IAttackBroadcast {
  type: "attack";
  from: IPos;
  to: IPos;
  value: number;
}
