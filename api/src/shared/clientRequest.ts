// Define the type of game messages from the client.
export interface IClientLoadRequest {
  type: "load";
}

interface IPos {
  x: number;
  y: number;
}

export const oneTileActions = [
  "new",
  "defenceUp",
  "offenceUp",
  "productivityUp",
  "attackRangeUp"
];

export interface IClientOneTileClickRequest extends IPos {
  type: "new" | "defenceUp" | "offenceUp" | "productivityUp" | "attackRangeUp";
  x: number;
  y: number;
}

export const twoTilesActions = ["attack"];

export interface IClientTwoTilesClickRequest {
  type: "attack";
  from: IPos;
  to: IPos;
}

export type ClientRequest =
  | IClientLoadRequest
  | IClientOneTileClickRequest
  | IClientTwoTilesClickRequest;

export const validateClientRequest = (request: ClientRequest) =>
  !!request &&
  !!request.type &&
  ["load", ...oneTileActions, ...twoTilesActions].some(t => t === request.type);
