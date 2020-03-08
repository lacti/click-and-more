import startProcessActionQueue from "./action";
import startGameStateMachine from "./game";
import { GlobalStage, waitGlobalStage } from "./global";
import lobbyAuthenticate from "./lobby";

export default async function startStateMachine() {
  // Step 1. Install input device processor.
  startProcessActionQueue();

  try {
    while (true) {
      // Step 2. Work with lobby.
      const start = await lobbyAuthenticate();

      // Step 3. connect with game.
      await startGameStateMachine(start);

      // Step 4. Wait until starting a new game.
      await waitGlobalStage(GlobalStage.Initialized);
    }
  } catch (error) {
    console.error("State machine is broken :)", error);
  }
}
