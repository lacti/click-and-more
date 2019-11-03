import React, { useEffect, useState, useCallback } from "react";
import useWebSocket from "react-use-websocket";
import "./App.css";
import { IContext, GameResponse, updateContext, GameRequest } from "./models";
import { coalesceClick } from "./events/coalesceClick";
import TileBoard from "./components/TileBoard";
import { ReadyStateEnum } from "react-use-websocket/dist/lib/use-websocket";

const webSocketUrl = process.env.REACT_APP_WEBSOCKET_URL!;

const App: React.FC = () => {
  const [socketUrl] = useState(webSocketUrl);
  const [context, setContext] = useState<IContext>({
    board: [],
    colors: {},
    me: -1
  });
  const [sendMessage, lastMessage, readyState] = useWebSocket(socketUrl);
  const sendRequest = useCallback(
    (request: GameRequest) => sendMessage(JSON.stringify(request)),
    [sendMessage]
  );

  const onResponse = useCallback(
    (response: GameResponse) => setContext(updateContext(context, response)),
    [context, setContext]
  );
  useEffect(
    () =>
      !!lastMessage
        ? onResponse(JSON.parse(lastMessage.data) as GameResponse)
        : undefined,
    // eslint-disable-next-line
    [lastMessage]
  );
  useEffect(() => {
    if (readyState === ReadyStateEnum.Open) {
      sendRequest({ type: "load" });
    }
  }, [readyState, sendRequest]);

  return context.me < 0 ? (
    <div className="App">Loading...</div>
  ) : (
    <TileBoard
      board={context.board}
      colors={context.colors}
      onClick={coalesceClick(data => sendRequest({ type: "click", data }))}
    />
  );
};

export default App;
