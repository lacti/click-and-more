import React from "react";
import { ITile, ColorMap } from "../models";
import Tile, { OnTileClick } from "./Tile";

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

export default TileRow;
