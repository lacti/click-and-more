import React, { useEffect, useState, useCallback } from "react";
import useWebSocket from "react-use-websocket";
import "./App.css";

export interface ITile {
  i: number;
  v: number;
}
const webSocketUrl = process.env.REACT_APP_WEBSOCKET_URL!;

export type BoardRow = ITile[];
export type Board = BoardRow[];
export interface IPos {
  x: number;
  y: number;
}

export type ChangedTile = ITile & IPos;

export interface IUser {
  index: number;
  color: string;
}

export interface ILoadRequest {
  type: "load";
}

export interface IClickRequest {
  type: "click";
  data: Array<
    {
      delta: number;
    } & IPos
  >;
}

export interface IEnterBroadcast {
  type: "newbie";
  newbie: IUser;
}

export interface ILeaveBroadcast {
  type: "leaved";
  leaver: IUser;
}

export interface ILoadResponse {
  type: "entered";
  me: IUser;
  users: IUser[];
  board: Board;
}

export interface IClickedBroadcast {
  type: "clicked";
  values: ChangedTile[];
}
export type Response =
  | IEnterBroadcast
  | ILeaveBroadcast
  | ILoadResponse
  | IClickedBroadcast;

interface IContext {
  me: number;
  colors: { [index: number]: string };
  board: Board;
}

const App: React.FC = () => {
  const [socketUrl] = useState(webSocketUrl);
  const [loaded, setLoaded] = useState(false);
  const [context, setContext] = useState<IContext>({
    me: 0,
    colors: {},
    board: []
  });
  const [sendMessage, lastMessage, readyState] = useWebSocket(socketUrl);
  console.log(loaded, context);

  const sendLoadEvent = useCallback(
    () => sendMessage(JSON.stringify({ type: "load" } as ILoadRequest)),
    [sendMessage]
  );
  const sendClickEvent = useCallback(
    (y: number, x: number) =>
      sendMessage(
        JSON.stringify({
          type: "click",
          data: [{ y, x, delta: 1 }]
        } as IClickRequest)
      ),
    [sendMessage]
  );

  const onLoad = useCallback(
    (response: ILoadResponse) => {
      setLoaded(true);
      setContext({
        me: response.me.index,
        colors: response.users
          .map(u => [u.index, u.color])
          .reduce(
            (obj, [index, color]) => Object.assign(obj, { [index]: color }),
            {} as { [index: number]: string }
          ),
        board: response.board
      });
    },
    [setLoaded, setContext]
  );
  const onNewbie = useCallback(
    (response: IEnterBroadcast) => {
      if (!loaded) {
        return;
      }
      setContext({
        ...context,
        colors: {
          ...context.colors,
          [response.newbie.index]: response.newbie.color
        }
      });
    },
    [setContext, loaded, context]
  );

  const onLeave = useCallback(
    (response: ILeaveBroadcast) => {
      if (!loaded) {
        return;
      }
      const remainColors = { ...context.colors };
      delete remainColors[response.leaver.index];
      setContext({
        ...context,
        colors: remainColors
      });
    },
    [setContext, loaded, context]
  );

  const onClicked = useCallback(
    (response: IClickedBroadcast) => {
      if (!loaded) {
        return;
      }
      const newBoard = [
        ...context.board.map(row => [...row.map(tile => ({ ...tile }))])
      ];
      for (const value of response.values) {
        newBoard[value.y][value.x] = { i: value.i, v: value.v };
      }
      setContext({
        ...context,
        board: newBoard
      });
    },
    [setContext, loaded, context]
  );

  useEffect(() => {
    if (lastMessage !== null) {
      const response = JSON.parse(lastMessage.data) as Response;
      console.log(response);
      switch (response.type) {
        case "entered":
          return onLoad(response);
        case "newbie":
          return onNewbie(response);
        case "leaved":
          return onLeave(response);
        case "clicked":
          return onClicked(response);
      }
    }
  }, [lastMessage]);
  useEffect(() => {
    const CONNECTION_STATUS_OPEN = 1;
    if (readyState === CONNECTION_STATUS_OPEN) {
      sendLoadEvent();
    }
  }, [readyState, sendLoadEvent]);
  return !loaded || !context.board ? (
    <div className="App">Loading...</div>
  ) : (
    <table>
      <tbody>
        {context.board.map((row, y) => (
          <tr key={`row_${y}`}>
            {row.map((tile, x) => (
              <td
                className="tile"
                key={`col_${y}_${x}`}
                style={{
                  backgroundColor:
                    tile.i >= 0 ? context.colors[tile.i] : "transparent"
                }}
                onClick={() => sendClickEvent(y, x)}
              >
                {tile.v}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default App;
