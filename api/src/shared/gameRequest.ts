import {
  IClientLoadRequest,
  IClientOneTileClickRequest,
  IClientTwoTilesClickRequest,
  oneTileActions,
  twoTilesActions
} from "./clientRequest";

export interface IGameConnectionIdRequest {
  connectionId: string;
}

export interface IGameEnterRequest extends IGameConnectionIdRequest {
  type: "enter";
  memberId: string;
}

export interface IGameLeaveRequest extends IGameConnectionIdRequest {
  type: "leave";
}

export interface IGameLoadRequest
  extends IClientLoadRequest,
    IGameConnectionIdRequest {}

export interface IGameOneTileClickRequest
  extends IClientOneTileClickRequest,
    IGameConnectionIdRequest {}

export interface IGameTwoTilesClickRequest
  extends IClientTwoTilesClickRequest,
    IGameConnectionIdRequest {}

export type GameRequest =
  | IGameEnterRequest
  | IGameLeaveRequest
  | IGameLoadRequest
  | IGameOneTileClickRequest
  | IGameTwoTilesClickRequest;

export function isOneTileAction(
  request: GameRequest
): request is IGameOneTileClickRequest {
  return oneTileActions.includes(request.type);
}

export function isTwoTilesAction(
  request: GameRequest
): request is IGameTwoTilesClickRequest {
  return twoTilesActions.includes(request.type);
}
