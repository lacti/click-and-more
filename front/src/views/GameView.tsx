import * as React from "react";
import { GameContext } from "../models/context";
import TileBoard from "../components/TileBoard";
import UpgradePanel from "../components/UpgradePanel";

export default function GameView({ context }: { context: GameContext }) {
  return (
    <React.Fragment>
      <div className="Head">
        <span className="Age" role="img" aria-label="Age">
          ⏲️ {context.age}
        </span>
        <span className="Energy" role="img" aria-label="Energy">
          ⚡ {context.energy}
        </span>
        <span className="Status" style={{ color: context.colors[context.me] }}>
          I'm ■
        </span>
      </div>
      <TileBoard {...context} />
      <UpgradePanel {...context} />
    </React.Fragment>
  );
}
