import React from "react";
import { ColorMap, Board, IPos } from "../models";
import TileRow from "./TileRow";

function TileBoard({
  board,
  colors,
  me,
  selected
}: {
  board: Board;
  colors: ColorMap;
  me: number;
  selected: IPos | null;
}) {
  return (
    <table className="Board">
      <tbody>
        {board.map((row, y) => (
          <TileRow
            key={`row_${y}`}
            row={row}
            y={y}
            colors={colors}
            me={me}
            selected={selected}
          />
        ))}
      </tbody>
    </table>
  );
}

export default TileBoard;
