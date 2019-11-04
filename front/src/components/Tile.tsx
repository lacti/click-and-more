import React from "react";
import { ITile, ColorMap } from "../models";

export type OnTileClick = (y: number, x: number) => void;

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
    // The latency from onClick is huge.
    onMouseDown={() => onClick(y, x)}
  >
    {tile.v}
  </td>
));

export default Tile;
