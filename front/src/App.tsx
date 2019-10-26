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

export type ColorMap = { [index: number]: string };

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
  colors: ColorMap;
  board: Board;
}

type YxValue<V> = { [y: number]: { [x: number]: V } };
type YxCount = YxValue<number>;
type YxTile = YxValue<ITile>;

type OnTileClick = (y: number, x: number) => void;
type OnTileBulkClick = (data: IClickRequest["data"]) => void;

const coalesceClick = (callback: OnTileBulkClick) => {
  const interval = 100;
  type ClickContext = {
    start: number;
    count: YxCount;
    timer: NodeJS.Timer;
  };
  let ctx: ClickContext | null = null;
  const flushContext = () => {
    if (ctx !== null) {
      clearTimeout(ctx.timer);
      const data = Object.entries(ctx.count).flatMap(([y, xv]) =>
        Object.entries(xv).map(([x, v]) => ({ y: +y, x: +x, delta: +v }))
      );
      callback(data);
    }
    ctx = null;
  };
  return (y: number, x: number) => {
    if (ctx !== null && Date.now() - ctx.start > interval) {
      flushContext();
    }
    if (ctx === null) {
      ctx = {
        start: Date.now(),
        count: {},
        timer: setTimeout(flushContext, interval)
      };
    }
    if (!ctx.count[y]) {
      ctx.count[y] = {};
    }
    if (!ctx.count[y][x]) {
      ctx.count[y][x] = 1;
    } else {
      ctx.count[y][x]++;
    }
    clearTimeout(ctx.timer);
    ctx.timer = setTimeout(flushContext, interval);
  };
};

const App: React.FC = () => {
  const [socketUrl] = useState(webSocketUrl);
  const [context, setContext] = useState<IContext>({
    board: [],
    colors: {},
    me: -1
  });
  const [sendMessage, lastMessage, readyState] = useWebSocket(socketUrl);
  const sendLoadEvent = useCallback(
    () => sendMessage(JSON.stringify({ type: "load" } as ILoadRequest)),
    [sendMessage]
  );
  const sendClickEvent = useCallback(
    (data: IClickRequest["data"]) => {
      sendMessage(
        JSON.stringify({
          type: "click",
          data
        } as IClickRequest)
      );
    },
    [sendMessage]
  );

  const onLoad = useCallback(
    (response: ILoadResponse) => {
      setContext({
        me: response.me.index,
        colors: response.users
          .map(u => [u.index, u.color])
          .reduce(
            (obj, [index, color]) => Object.assign(obj, { [index]: color }),
            {} as ColorMap
          ),
        board: response.board
      });
    },
    [setContext]
  );
  const onNewbie = useCallback(
    (response: IEnterBroadcast) => {
      setContext({
        ...context,
        colors: {
          ...context.colors,
          [response.newbie.index]: response.newbie.color
        }
      });
    },
    [setContext, context]
  );

  const onLeave = useCallback(
    (response: ILeaveBroadcast) => {
      const remainColors = { ...context.colors };
      delete remainColors[response.leaver.index];
      setContext({
        ...context,
        colors: remainColors
      });
    },
    [setContext, context]
  );

  const onClicked = useCallback(
    (response: IClickedBroadcast) => {
      const ys = new Set<number>();
      const yxValues: YxTile = {};
      for (const { x, y, i, v } of response.values) {
        ys.add(y);
        if (!yxValues[y]) {
          yxValues[y] = {};
        }
        yxValues[y][x] = { i, v };
      }
      if (response.values.length > 0) {
        setContext({
          ...context,
          board: [
            ...context.board.map((row, y) =>
              ys.has(y)
                ? [...row.map((tile, x) => yxValues[y][x] || tile)]
                : row
            )
          ]
        });
      }
    },
    [setContext, context]
  );

  useEffect(() => {
    if (!lastMessage) {
      return;
    }
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
    // eslint-disable-next-line
  }, [lastMessage]);
  useEffect(() => {
    const CONNECTION_STATUS_OPEN = 1;
    if (readyState === CONNECTION_STATUS_OPEN) {
      sendLoadEvent();
    }
  }, [readyState, sendLoadEvent]);
  return context.me < 0 ? (
    <div className="App">Loading...</div>
  ) : (
    <TileBoard
      board={context.board}
      colors={context.colors}
      onClick={coalesceClick(sendClickEvent)}
    />
  );
};

const TileBoard: React.FC<{
  board: Board;
  colors: ColorMap;
  onClick: OnTileClick;
}> = ({ board, colors, onClick }) => (
  <table>
    <tbody>
      {board.map((row, y) => (
        <TileRow
          key={`row_${y}`}
          row={row}
          y={y}
          colors={colors}
          onClick={onClick}
        />
      ))}
    </tbody>
  </table>
);

const TileRow: React.FC<{
  row: ITile[];
  y: number;
  colors: ColorMap;
  onClick: OnTileClick;
}> = React.memo(({ row, y, colors, onClick }) => (
  <tr>
    {row.map((tile, x) => (
      <Tile
        key={`tile_${y}_${x}`}
        tile={tile}
        y={y}
        x={x}
        colors={colors}
        onClick={onClick}
      />
    ))}
  </tr>
));

const Tile: React.FC<{
  tile: ITile;
  x: number;
  y: number;
  colors: ColorMap;
  onClick: OnTileClick;
}> = React.memo(({ tile, x, y, colors, onClick }) => (
  <td
    className="tile"
    key={`col_${y}_${x}`}
    style={{
      backgroundColor: tile.i >= 0 ? colors[tile.i] : "transparent"
    }}
    onClick={() => onClick(y, x)}
  >
    {tile.v}
  </td>
));

export default App;
