import copy from "fast-copy";
import {
  IGameStart,
  GameResponse,
  GameStage,
  GameRequest,
  newGameContext,
  ResponseRecord
} from "../models";
import { enqueueAction } from "./action";
import sleep from "../utils/sleep";
import {
  GlobalStage,
  getGlobalStage,
  getGlobalStateValue,
  updateGlobalStage,
  updateGlobalState,
  resetGameContext
} from "./global";

const deferredDisconnectDelayMillis = 500;
const deferredLoadDelayMillis = 100;

export default function startGameStateMachine(start: IGameStart) {
  const connectionUrl = buildGameConnectionUrl(start);
  console.info("Connect the game server with", connectionUrl);

  updateGlobalState({
    stage: GlobalStage.GameStarting,
    currentGameId: start.gameId
  });
  const gameSocket = new WebSocket(connectionUrl);
  const records: ResponseRecord[] = [];
  const startTime = Date.now();

  function onThisGame<Args extends any[]>(work: (...args: Args) => void) {
    return (...args: Args) => {
      if (getGlobalStateValue("currentGameId") !== start.gameId) {
        console.error("Socket is too old");
        return;
      }
      work(...args);
    };
  }

  function sendRequest(request: GameRequest) {
    if (start.observer && request.type !== "load") {
      console.info("Observer cannot send a message", start.gameId, request);
    } else {
      console.info("Send a message into the server", start.gameId, request);
      gameSocket.send(JSON.stringify(request));
    }
  }

  function onSocketOpen() {
    // Step 1. Start to send a message via this socket.
    updateGlobalState({
      stage: GlobalStage.GameUserWaiting,
      currentGameId: start.gameId,
      gameContext: newGameContext(),
      send: onThisGame(sendRequest)
    });
    sleep(deferredLoadDelayMillis).then(() => {
      sendRequest({
        type: "load"
      });
    });
  }

  function onSocketClose(closedCallback: () => void) {
    return () => {
      // Step 2. Anyway, this game is finished but is this intentional situation?
      switch (getGlobalStage()) {
        case GlobalStage.GameError:
        case GlobalStage.GameEnd:
          break;
        default:
          updateGlobalStage(GlobalStage.GameError);
          break;
      }
      // Anyway, this game is over.
      resetGameContext();
      closedCallback();
    };
  }

  function onSocketError(event: Event) {
    console.error("Socket has an error", event);
    // Step 3. Transit to error state only if connecting.
    // Because it is ignorable that an error occurred while sending a request.
    if (getGlobalStage() === GlobalStage.GameStarting) {
      updateGlobalStage(GlobalStage.GameError);
    }
    // TODO Should we reconnect this game?
  }

  function onSocketMessage(event: MessageEvent) {
    // Step 4. Put a message from the server into the action queue.
    try {
      const response: GameResponse = JSON.parse(event.data);
      if (!response.type) {
        // Is server OK?
        console.error("Invalid response", response);
        return;
      }
      console.info("Server response", response);
      enqueueAction({
        type: "serverResponse",
        payload: response
      });
      records.push({ ...copy(response), _time: Date.now() - startTime });

      if (response.type === "stage") {
        if (
          response.stage === GameStage.Running &&
          getGlobalStage() !== GlobalStage.GameRunning
        ) {
          console.info("Game is starting");
          updateGlobalStage(GlobalStage.GameRunning);
        }
      }
      if (response.type === "end") {
        console.info("Game is ended");
        updateGlobalStage(GlobalStage.GameEnd);
        sleep(deferredDisconnectDelayMillis).then(() => {
          if (gameSocket.readyState === WebSocket.CONNECTING) {
            gameSocket.close();
          }
        });
        console.log(records);
        console.log(JSON.stringify(records));
      }
    } catch (error) {
      // TODO Are we ok?
      console.error(event, error);
    }
  }

  gameSocket.addEventListener("open", onThisGame(onSocketOpen));
  gameSocket.addEventListener("error", onThisGame(onSocketError));
  gameSocket.addEventListener("message", onThisGame(onSocketMessage));
  return new Promise<void>(resolve => {
    gameSocket.addEventListener("close", onThisGame(onSocketClose(resolve)));
  });
}

function buildGameConnectionUrl({ url, gameId, playerId }: IGameStart) {
  return `${url}?x-game-id=${gameId}&x-member-id=${playerId}`;
}
