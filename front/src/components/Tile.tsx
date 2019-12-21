import React from "react";
import { ITile, ColorMap } from "../models";

export type OnTileClick = (y: number, x: number) => void;

const Tile: React.FC<{
  tile: ITile;
  x: number;
  y: number;
  colors: ColorMap;
  me: number;
  onClick: OnTileClick;
}> = React.memo(({ tile, x, y, colors, me, onClick }) => (
  <td
    className="tile"
    key={`col_${y}_${x}`}
    style={{
      backgroundColor: tile.i >= 0 ? colors[tile.i] : "transparent",
      fontWeight: tile.i === me ? `bold` : `normal`
    }}
    // The latency from onClick is huge.
    onMouseDown={() => onClick(y, x)}
  >
    {(tile.v || 0).toFixed(2)}
  </td>
));

export default Tile;
