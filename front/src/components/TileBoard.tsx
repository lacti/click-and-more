import React from "react";
import { ColorMap, Board } from "../models";
import { OnTileClick } from "./Tile";
import TileRow from "./TileRow";

const TileBoard: React.FC<{
  board: Board;
  colors: ColorMap;
  me: number;
  onClick: OnTileClick;
}> = ({ board, colors, me, onClick }) => (
  <table>
    <tbody>
      {board.map((row, y) => (
        <TileRow
          key={`row_${y}`}
          row={row}
          y={y}
          colors={colors}
          me={me}
          onClick={onClick}
        />
      ))}
    </tbody>
  </table>
);

export default TileBoard;
