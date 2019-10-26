import { Board, ChangedTile, IPos, IUser } from "./model";

export interface IConnectionId {
  connectionId: string;
}

export interface IEnterRequest extends IConnectionId {
  type: "enter";
}

export interface IEnterBroadcast {
  type: "newbie";
  newbie: IUser;
}

export interface ILeaveRequest extends IConnectionId {
  type: "leave";
}

export interface ILeaveBroadcast {
  type: "leaved";
  leaver: IUser;
}

export interface ILoadRequest extends IConnectionId {
  type: "load";
}

export interface ILoadResponse {
  type: "entered";
  me: IUser;
  users: IUser[];
  board: Board;
}

export interface IClickRequest extends IConnectionId {
  type: "click";
  data: Array<
    {
      delta: number;
    } & IPos
  >;
}

export interface IClickedBroadcast {
  type: "clicked";
  values: ChangedTile[];
}

export type ActionRequest = ILoadRequest | IClickRequest;

export type Request = IEnterRequest | ILeaveRequest | ActionRequest;

export type Response =
  | IEnterBroadcast
  | ILeaveBroadcast
  | ILoadResponse
  | IClickedBroadcast;
