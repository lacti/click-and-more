// Define the type of game messages from the client.
export interface IClientLoadRequest {
  type: "load";
}

export interface IClientClickRequest {
  type: "click";
  data: Array<{
    x: number;
    y: number;
    value: number;
  }>;
}

export interface IClientLevelUpRequest {
  type: "levelUp";
  data: Array<{
    x: number;
    y: number;
    value: number;
  }>;
}

export type ClientRequest = IClientLoadRequest | IClientClickRequest | IClientLevelUpRequest;

export const validateClientRequest = (request: ClientRequest) =>
  !!request &&
  !!request.type &&
  // TODO Types of message can be more generalized.
  ["load", "click", "levelUp"].some(t => t === request.type);
