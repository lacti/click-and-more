import * as React from "react";
import Game from "./Game";
import { IGameStart } from "./models";
import sleep from "./utils/sleep";

const authUrl = process.env.REACT_APP_AUTH_URL!;
const lobbyUrl = process.env.REACT_APP_LOBBY_URL!;
const gameApplicationId = process.env.REACT_APP_GAME_APPLICATION_ID!;
const userName = "Clicker";

async function authenticate(): Promise<IGameStart> {
  if (process.env.REACT_APP_LOCAL === "1") {
    const testStart = {
      gameId: "local-test-" + Date.now(),
      members: [{ memberId: "me" }]
    };
    fetch("http://localhost:3000/debug", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(testStart)
    })
      .then(console.log)
      .catch(console.log);
    await sleep(500);
    return {
      gameId: testStart.gameId,
      playerId: testStart.members[0].memberId,
      url: "ws://localhost:3001"
    };
  } else {
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
      const ws = new WebSocket(
        lobbyUrl + "?authorization=" + encodeURIComponent(`Bearer ${authToken}`)
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
}

export default function App() {
  const [start, setStart] = React.useState<IGameStart | null>(null);
  React.useEffect(() => {
    authenticate()
      .then(setStart)
      .catch(console.error);
  }, []);
  return start === null ? <div>Wait for other users</div> : <Game {...start} />;
}
