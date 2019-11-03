import { IPos } from "./domain";

export interface ILoadRequest {
  type: "load";
}

export interface IClickRequest {
  type: "click";
  data: Array<
    {
      value: number;
    } & IPos
  >;
}

export type GameRequest = ILoadRequest | IClickRequest;
