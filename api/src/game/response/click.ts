import { Board, diffBoards, TileChange } from "../model";
import { broadcast, IRespondResult } from "./support/broadcast";

interface IClickBroadcast {
  type: "click";
  changes: TileChange[];
}

interface IBroadcastArgs {
  newBoard: Board;
  connectionIds: string[];
}

export class ClickBroadcast {
  private lastBoard: Board;
  private sending: boolean = false;
  private pending: IBroadcastArgs | undefined;

  constructor(initial: Board) {
    this.lastBoard = initial;
  }

  public broadcast = async ({
    newBoard,
    connectionIds
  }: IBroadcastArgs): Promise<IRespondResult> => {
    // Skip if both of boards are reference equal.
    if (this.lastBoard === newBoard) {
      return {};
    }

    // Make a request pending until sent current one.
    if (this.sending) {
      console.debug(`Click broadcast`, `pending a request`);
      this.pending = { newBoard, connectionIds };
      return {};
    }

    // Update last reference.
    const oldBoard = this.lastBoard;
    this.lastBoard = newBoard;

    // Skip if there is no changes.
    const changes = diffBoards(oldBoard, newBoard);
    if (changes.length === 0) {
      console.debug(`Click broadcast`, `no changes`);
      return {};
    }

    // Send current changes.
    console.debug(`Click broadcast`, `send changes`, changes.length);
    this.sending = true;
    const result = await broadcast<IClickBroadcast>(connectionIds, {
      type: "click",
      changes
    });
    this.sending = false;

    // Return a result of broadcast if there is no pending request.
    if (this.pending === undefined) {
      return result;
    }

    // Or, process a pending request right now.
    console.debug(`Click broadcast`, `process next changes`);
    const oldPending = this.pending;
    this.pending = undefined;
    return this.broadcast(oldPending);
  };
}
