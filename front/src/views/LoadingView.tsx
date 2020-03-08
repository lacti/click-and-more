import * as React from "react";
import { GameContext } from "../models";

export default function LoadingView({ context }: { context: GameContext }) {
  return <div className="App">Wait other users...</div>;
}
