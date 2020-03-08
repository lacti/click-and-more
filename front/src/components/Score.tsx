/* eslint-disable jsx-a11y/accessible-emoji */
import * as React from "react";
import { GameContext } from "../models";
import { enqueueAction } from "../state/action";

function Score({ me, colors, score }: GameContext) {
  const scores = Object.entries(score)
    .map(([userIndex, { tile }]) => ({
      userIndex: +userIndex,
      tileCount: tile as number
    }))
    .sort((a, b) => b.tileCount - a.tileCount);

  return (
    <table className="UpgradePanel">
      <tbody>
        <tr>
          <td colSpan={scores.length}>
            {scores[0].userIndex === me ? "🏆 Win!" : "😭 Try again!"}
          </td>
        </tr>
        <tr>
          {scores.map(({ userIndex, tileCount }, index) => {
            return (
              <td key={userIndex}>
                <span style={{ color: colors[userIndex] }}>▅</span> {tileCount}
                <span>{index === 0 ? "🏆" : ""}</span>
              </td>
            );
          })}
        </tr>
        <tr>
          <td colSpan={scores.length}>
            <button
              onClick={() =>
                enqueueAction({
                  type: "gameRestart"
                })
              }
            >
              <span>🤔</span> Restart!
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default React.memo(Score);
