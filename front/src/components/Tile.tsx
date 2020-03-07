import React from "react";
import { ITile, ColorMap } from "../models";
import { enqueueAction } from "../state/action";

export type OnTileClick = (y: number, x: number) => void;

function Tile({
  tile,
  x,
  y,
  colors,
  me,
  selected
}: {
  tile: ITile;
  x: number;
  y: number;
  colors: ColorMap;
  me: number;
  selected: boolean;
}) {
  return (
    <td
      className="Tile"
      key={`col_${y}_${x}`}
      style={{
        backgroundColor: tile.i >= 0 ? colors[tile.i] : "transparent",
        fontWeight: tile.i === me ? `bold` : `normal`,
        border: selected ? `3px solid black` : undefined
      }}
      // The latency from onClick is huge.
      onMouseDown={() => enqueueAction({ type: "tileClick", y, x })}
    >
      <span className="Defence" role="img" aria-label="Defence">
        🛡️ {tile.defence}
      </span>
      <span className="Offence" role="img" aria-label="Offence">
        ⚔️ {tile.offence}
      </span>
      <br />
      <span className="Productivity" role="img" aria-label="Productivity">
        🏭 {tile.productivity}
      </span>
      <span className="AttackRange" role="img" aria-label="DefeAttackRangence">
        💥 {tile.attackRange}
      </span>
    </td>
  );
}

// export default React.memo(Tile);
export default Tile;
