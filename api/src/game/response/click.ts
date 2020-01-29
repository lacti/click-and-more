import logger from "../logger";
import { Board, diffBoards, tileCoreEquals, TileSync } from "../model";
import { broadcast, IRespondResult } from "./support/broadcast";

interface IClickBroadcast {
  type: "click";
  changes: TileSync[];
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
      logger.debug(`Click broadcast`, `pending a request`);
      this.pending = { newBoard, connectionIds };
      return {};
    }

    // Update last reference.
    const oldBoard = this.lastBoard;
    this.lastBoard = newBoard;

    // Skip if there is no changes.
    const changes = diffBoards(oldBoard, newBoard, tileCoreEquals);
    if (changes.length === 0) {
      // logger.debug(`Click broadcast`, `no changes`);
      return {};
    }

    // Send current changes.
    logger.debug(`Click broadcast`, `send changes`, JSON.stringify(changes));
    this.sending = true;
    try {
      const result = await broadcast<IClickBroadcast>(connectionIds, {
        type: "click",
        changes
      });
      // Return a result of broadcast if there is no pending request.
      if (this.pending === undefined) {
        return result;
      }
    } catch (error) {
      logger.error(`Cannot broadcast messages`, changes, error);
    } finally {
      this.sending = false;
    }

    // Or, process a pending request right now.
    logger.debug(`Click broadcast`, `process next changes`);
    const oldPending = this.pending;
    this.pending = undefined;
    return this.broadcast(oldPending);
  };
}
