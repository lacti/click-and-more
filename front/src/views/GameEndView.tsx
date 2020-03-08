import * as React from "react";
import { GameContext } from "../models/context";
import TileBoard from "../components/TileBoard";
import Score from "../components/Score";

export default function GameEndView({ context }: { context: GameContext }) {
  return (
    <React.Fragment>
      <div className="Head">
        <span className="Age" role="img" aria-label="Age">
          ⏲️ Game Over!
        </span>
        <span className="Energy" role="img" aria-label="Energy">
          ⚡ {context.energy}
        </span>
      </div>
      <TileBoard {...context} />
      <Score {...context} />
    </React.Fragment>
  );
}
