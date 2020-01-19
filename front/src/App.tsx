import React, { useEffect, useState, useCallback } from "react";
import useWebSocket from "react-use-websocket";
import "./App.css";
import {
  IContext,
  GameResponse,
  updateContext,
  GameRequest,
  GameStage,
  initialContext
} from "./models";
// import { coalesceClick } from "./events/coalesceClick";
import TileBoard from "./components/TileBoard";
import { ReadyStateEnum } from "react-use-websocket/dist/lib/use-websocket";
import { logHook } from "./utils/logger";

const webSocketUrl = process.env.REACT_APP_WEBSOCKET_URL!;

// const filterLevelUp = (context: IContext) => ({
//   value,
//   y,
//   x
// }: IClickRequest["data"]) => {
//   const tile = context.board[y][x];
//   const v = Math.floor(tile.v);
//   if (tile.i === context.me && v % 10 === 0) {
//   }
// };

const App: React.FC = () => {
  const [socketUrl] = useState(webSocketUrl);
  const [context, setContext] = useState<IContext>(initialContext);
  const [sendMessage, lastMessage, readyState] = useWebSocket(socketUrl);
  const sendRequest = useCallback(
    (request: GameRequest) =>
      sendMessage(JSON.stringify(logHook(`Request`)(request))),
    [sendMessage]
  );
  const sendClickOne = useCallback(
    (y: number, x: number) => {
      if (context.stage !== GameStage.Running) {
        return;
      }
      const tile = context.board[y][x];
      const type = tile.i === context.me && tile.p ? "levelUp" : "click";
      sendRequest({ type, data: [{ y, x, value: 1 }] });
    },
    [sendRequest, context]
  );

  const onResponse = useCallback(
    (response: GameResponse) =>
      setContext(logHook(`Context`)(updateContext(context, response))),
    [context, setContext]
  );
  useEffect(
    () =>
      !!lastMessage
        ? onResponse(
            logHook(`Response`)(JSON.parse(lastMessage.data) as GameResponse)
          )
        : undefined,
    // eslint-disable-next-line
    [lastMessage]
  );
  useEffect(() => {
    if (readyState === ReadyStateEnum.Open) {
      sendRequest({ type: "load" });
    }
  }, [readyState, sendRequest]);

  return context.stage === GameStage.Wait ? (
    <div className="App">Loading... ({context.age})</div>
  ) : (
    <React.Fragment>
      <div className="App">Age ({context.age})</div>
      <TileBoard
        board={context.board}
        colors={context.colors}
        me={context.me}
        // onClick={coalesceClick(sendClick)}
        onClick={sendClickOne}
      />
    </React.Fragment>
  );
};

export default App;
