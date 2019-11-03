import { GameRequest } from "../../shared/gameRequest";

// To use this value as Redis parameter, make it as a string value.
export const encodeMessage = (message: GameRequest) =>
  JSON.stringify(JSON.stringify(message));
