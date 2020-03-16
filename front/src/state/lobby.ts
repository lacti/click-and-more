import { IGameStart } from "../models";
import sleep from "../utils/sleep";
import { GlobalStage, updateGlobalStage } from "./global";

const authUrl = process.env.REACT_APP_AUTH_URL!;
const lobbyUrl = process.env.REACT_APP_LOBBY_URL!;
const gameApplicationId = window.location.href.includes("?single=1")
  ? "ca9a2697-229f-4569-a282-1044f3037a86"
  : process.env.REACT_APP_GAME_APPLICATION_ID!;
const userName = "Clicker";

export default async function lobbyAuthenticate(): Promise<IGameStart> {
  updateGlobalStage(GlobalStage.LobbyWaiting);

  if (process.env.REACT_APP_LOCAL === "1") {
    return setupLobbyInLocal();
  } else {
    return setupLobbyInProduction();
  }
}

async function setupLobbyInLocal() {
  return new Promise<IGameStart>(async (resolve, reject) => {
    const testStart = {
      gameId: "local-test-" + Date.now(),
      members: [{ memberId: "me" }, { memberId: "ob", observer: true }]
    };
    fetch("http://localhost:3000/debug", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(testStart)
    })
      .then(console.log)
      .catch(reject);
    await sleep(500);
    resolve({
      gameId: testStart.gameId,
      playerId: testStart.members[0].memberId,
      url: "ws://localhost:3001",
      observer: testStart.members[0].observer
    });
  });
}

async function setupLobbyInProduction() {
  return new Promise<IGameStart>(async (resolve, reject) => {
    const authToken = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: userName,
        applications: [gameApplicationId]
      })
    })
      .then(token => token.text())
      .catch(reject);
    if (authToken === undefined) {
      return;
    }

    const ws = new WebSocket(
      lobbyUrl + "?authorization=" + encodeURIComponent(authToken as string)
    );
    ws.onerror = reject;
    ws.onopen = () => {
      ws.send(
        JSON.stringify({ type: "match", application: gameApplicationId })
      );
    };
    ws.onmessage = event => {
      const message = JSON.parse(event.data) as IGameStart;
      resolve(message);
    };
  });
}
