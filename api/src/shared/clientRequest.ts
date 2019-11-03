// Define the type of game messages from the client.
export interface IClientLoadRequest {
  type: "load";
}

export interface IClientClickRequest {
  type: "click";
  x: number;
  y: number;
  value: number;
}

export type ClientRequest = IClientLoadRequest | IClientClickRequest;

export const validateClientRequest = (request: ClientRequest) =>
  !!request &&
  !!request.type &&
  // TODO Types of message can be more generalized.
  ["load", "click"].some(t => t === request.type);
