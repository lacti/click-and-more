import {
  IClientLoadRequest,
  IClientOneTileClickRequest,
  IClientTwoTilesClickRequest
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
