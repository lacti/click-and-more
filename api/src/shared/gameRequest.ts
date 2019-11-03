import { IClientClickRequest, IClientLoadRequest } from "./clientRequest";

export interface IGameConnectionIdRequest {
  connectionId: string;
}

export interface IGameEnterRequest extends IGameConnectionIdRequest {
  type: "enter";
}

export interface IGameLeaveRequest extends IGameConnectionIdRequest {
  type: "leave";
}

export interface IGameLoadRequest
  extends IClientLoadRequest,
    IGameConnectionIdRequest {}

export interface IGameClickRequest
  extends IClientClickRequest,
    IGameConnectionIdRequest {}

export type GameRequest =
  | IGameEnterRequest
  | IGameLeaveRequest
  | IGameLoadRequest
  | IGameClickRequest;
