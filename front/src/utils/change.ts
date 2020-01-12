import { YxTile, TileChange } from "../models";

export const changesAsMap = (changes: TileChange[]) => {
  const ys = new Set<number>();
  const yxValues: YxTile = {};
  for (const { x, y, i, v, l, p } of changes) {
    ys.add(y);
    if (!yxValues[y]) {
      yxValues[y] = {};
    }
    yxValues[y][x] = { i, v, l, p };
  }
  return { ys, yxValues };
};
