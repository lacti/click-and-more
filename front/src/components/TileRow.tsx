import React from "react";
import { ITile, ColorMap, IPos } from "../models";
import Tile from "./Tile";

function TileRow({
  row,
  y,
  colors,
  me,
  selected
}: {
  row: ITile[];
  y: number;
  colors: ColorMap;
  me: number;
  selected: IPos | null;
}) {
  return (
    <tr>
      {row.map((tile, x) => (
        <Tile
          key={`tile_${y}_${x}`}
          tile={tile}
          y={y}
          x={x}
          colors={colors}
          me={me}
          selected={selected !== null && selected.y === y && selected.x === x}
        />
      ))}
    </tr>
  );
}

// export default React.memo(TileRow);
export default TileRow;
