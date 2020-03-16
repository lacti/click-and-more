import { ResponseRecord } from "../models";
import startProcessActionQueue, { enqueueAction } from "./action";
import sleep from "../utils/sleep";
import { updateGlobalStage, GlobalStage } from "./global";

const recorded: ResponseRecord[] = [];

/**
 * TODO
 * 1. New game or view reply?
 * 2. where to save reply data
 * 3. move logics from game.ts to reducer
 * 4. add option to record or not
 * 5. recorder timeline api?
 * 6. dockerize(?) for local ai dev
 */
export default async function startStateRecordedMachine() {
  updateGlobalStage(GlobalStage.GameRunning);

  // Step 1. Install input device processor.
  startProcessActionQueue();

  try {
    let lastTime = 0;
    for (const record of recorded) {
      const delay = record._time - lastTime;
      console.log(delay, record);
      await sleep(delay);
      lastTime = record._time;

      enqueueAction({
        type: "serverResponse",
        payload: record
      });
    }
  } catch (error) {
    console.error("State machine is broken :)", error);
  }
}
