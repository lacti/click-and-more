import React from "react";
import { ITile, ColorMap } from "../models";
import Tile, { OnTileClick } from "./Tile";

const TileRow: React.FC<{
  row: ITile[];
  y: number;
  colors: ColorMap;
  me: number;
  onClick: OnTileClick;
}> = React.memo(({ row, y, colors, me, onClick }) => (
  <tr>
    {row.map((tile, x) => (
      <Tile
        key={`tile_${y}_${x}`}
        tile={tile}
        y={y}
        x={x}
        colors={colors}
        me={me}
        onClick={onClick}
      />
    ))}
  </tr>
));

export default TileRow;
