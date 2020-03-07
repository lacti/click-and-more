/* eslint-disable jsx-a11y/accessible-emoji */
import * as React from "react";
import { GameContext } from "../models";

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
          <td>{scores[0].userIndex === me ? "🏆 Win!" : "😭 Try again!"}</td>
        </tr>
        {scores.map(({ userIndex, tileCount }, index) => {
          return (
            <tr key={userIndex}>
              <td>
                <span style={{ color: colors[userIndex] }}>▅</span> {tileCount}
                <span>{index === 0 ? "🏆" : ""}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default React.memo(Score);
