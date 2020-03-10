import * as React from "react";
import {
  GameContext,
  Board,
  ITile,
  UpgradeAction,
  IValueMap,
  Costs
} from "../models";
import { enqueueAction } from "../state/action";

export default function UpgradePanel(context: GameContext) {
  const { selected, me, board } = context;
  if (selected === null) {
    return <div />;
  }
  const tile = board[selected.y][selected.x];
  if (tile.i === me) {
    return <UpgradeButtons {...context} />;
  } else if (tile.i === -1) {
    if (hasNearMyTile(board, me, selected.y, selected.x)) {
      return <BuyNewButton {...context} />;
    }
  }
  return <div />;
}

function costCalculate(tile: ITile, costs: Costs) {
  return (property: keyof IValueMap) =>
    costs[property].base + (tile[property] - 1) * costs[property].multiply;
}

function UpgradeButtons({ selected, board, costs }: GameContext) {
  const { y, x } = selected!;
  const tile = board[y][x];
  const costCalculator = costCalculate(tile, costs);
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
              energy={costCalculator("defence")}
            />
          </td>
          <td>
            <UpgradeButton
              emoji="⚔️"
              property="offenceUp"
              value={tile.offence}
              y={y}
              x={x}
              energy={costCalculator("offence")}
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
              energy={costCalculator("productivity")}
            />
          </td>
          <td>
            <UpgradeButton
              emoji="💥"
              property="attackRangeUp"
              value={tile.attackRange}
              y={y}
              x={x}
              energy={costCalculator("attackRange")}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function BuyNewButton({ selected, board, me, costs }: GameContext) {
  const { y, x } = selected!;
  const countOfMyTiles = board
    .map(row => row.filter(tile => tile.i === me).length)
    .reduce((a, b) => a + b, 0);
  const cost = costs.newTile.base + costs.newTile.multiply * countOfMyTiles;

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
              Buy a new tile <EnergyConsume value={cost} />
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
