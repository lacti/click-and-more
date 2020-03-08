import * as React from "react";
import { GameContext } from "../models";
import GameEndView from "./GameEndView";
import GameView from "./GameView";
import LoadingView from "./LoadingView";
import {
  GlobalStage,
  getCurrentGameContext,
  getGlobalStage
} from "../state/global";

const renderIntervalMillis = 33;

export default function ViewMain() {
  const [context, setContext] = React.useState<GameContext>(
    getCurrentGameContext()
  );
  React.useEffect(() => {
    const timer = setInterval(() => {
      setContext({ ...getCurrentGameContext() });
    }, renderIntervalMillis);
    return () => clearInterval(timer);
  }, []);

  switch (getGlobalStage()) {
    case GlobalStage.Initialized:
    case GlobalStage.LobbyWaiting:
    case GlobalStage.GameStarting:
    case GlobalStage.GameUserWaiting:
      return <LoadingView context={context} />;
    case GlobalStage.GameRunning:
    case GlobalStage.GameError:
      return <GameView context={context} />;
    case GlobalStage.GameEnd:
      return <GameEndView context={context} />;
  }
  throw new Error("Something is broken :)");
}
