import * as React from "react";
import { GameContext, Board, IPos, ITile, UpgradeAction } from "../models";
import { enqueueAction } from "../state/action";
import * as costs from "../models/costs";

export default function UpgradePanel({ me, board, selected }: GameContext) {
  if (selected === null) {
    return <div />;
  }
  const tile = board[selected.y][selected.x];
  if (tile.i === me) {
    return <UpgradeButtons pos={selected} tile={tile} />;
  } else if (tile.i === -1) {
    if (hasNearMyTile(board, me, selected.y, selected.x)) {
      return <BuyNewButton {...selected} />;
    }
  }
  return <div />;
}

function hasNearMyTile(board: Board, me: number, y: number, x: number) {
  return [
    [-1, 0],
    [0, -1],
    [1, 0],
    [0, 1]
  ]
    .map(([dy, dx]) => [y + dy, x + dx])
    .filter(
      ([ny, nx]) =>
        ny >= 0 && ny < board.length && nx >= 0 && nx < board[0].length
    )
    .some(([ny, nx]) => board[ny][nx].i === me);
}

function UpgradeButton({
  emoji,
  property,
  value,
  y,
  x,
  energy
}: {
  emoji: string;
  property: UpgradeAction["property"];
  value: number;
  y: number;
  x: number;
  energy: number;
}) {
  return (
    <button
      onClick={() =>
        enqueueAction({
          type: "upgrade",
          property,
          y: y,
          x: x
        })
      }
    >
      <span role="img" aria-label={property}>
        {emoji}
      </span>{" "}
      {value} /+1 <EnergyConsume value={energy} />
    </button>
  );
}

function UpgradeButtons({ pos: { y, x }, tile }: { pos: IPos; tile: ITile }) {
  return (
    <table className="UpgradePanel">
      <tbody>
        <tr>
          <td>
            <UpgradeButton
              emoji="🛡️"
              property="defenceUp"
              value={tile.defence}
              y={y}
              x={x}
              energy={costs.costToUpgradeDefence + (tile.defence - 1)}
            />
          </td>
          <td>
            <UpgradeButton
              emoji="⚔️"
              property="offenceUp"
              value={tile.offence}
              y={y}
              x={x}
              energy={costs.costToUpgradeOffence + (tile.offence - 1)}
            />
          </td>
        </tr>
        <tr>
          <td>
            <UpgradeButton
              emoji="🏭"
              property="productivityUp"
              value={tile.productivity}
              y={y}
              x={x}
              energy={costs.costToUpgradeProductivity + (tile.productivity - 1)}
            />
          </td>
          <td>
            <UpgradeButton
              emoji="💥"
              property="attackRangeUp"
              value={tile.attackRange}
              y={y}
              x={x}
              energy={
                costs.costToUpgradeAttackRange + (tile.attackRange - 1) * 2
              }
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function BuyNewButton({ y, x }: IPos) {
  return (
    <table className="UpgradePanel">
      <tbody>
        <tr>
          <td>
            <button
              onClick={() =>
                enqueueAction({
                  type: "buyNewTile",
                  y,
                  x
                })
              }
            >
              <span role="img" aria-label="NewLand">
                🗺️
              </span>
              Buy a new tile <EnergyConsume value={costs.costToBuyNewTile} />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function EnergyConsume({ value }: { value: number }) {
  return (
    <>
      (
      <span role="img" aria-label="Energy">
        ⚡
      </span>
      {value})
    </>
  );
}
