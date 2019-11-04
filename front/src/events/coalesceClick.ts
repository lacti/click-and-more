import { IClickRequest, YxCount } from "../models";

export type OnTileBulkClick = (data: IClickRequest["data"]) => void;

type ClickContext = {
  start: number;
  count: YxCount;
  timer: NodeJS.Timer;
};

export const coalesceClick = (
  callback: OnTileBulkClick,
  interval: number = 16
) => {
  let ctx: ClickContext | null = null;

  const flushContext = () => {
    if (ctx !== null) {
      clearTimeout(ctx.timer);
      const data = Object.entries(ctx.count).flatMap(([y, xv]) =>
        Object.entries(xv).map(([x, v]) => ({ y: +y, x: +x, value: +v }))
      );
      callback(data);
    }
    ctx = null;
  };

  return (y: number, x: number) => {
    console.info(`click`, y, x);
    if (ctx !== null && Date.now() - ctx.start > interval) {
      flushContext();
    }
    if (ctx === null) {
      ctx = {
        start: Date.now(),
        count: {},
        timer: setTimeout(flushContext, interval)
      };
    }
    if (!ctx.count[y]) {
      ctx.count[y] = {};
    }
    if (!ctx.count[y][x]) {
      ctx.count[y][x] = 1;
    } else {
      ctx.count[y][x]++;
    }
    clearTimeout(ctx.timer);
    ctx.timer = setTimeout(flushContext, interval);
  };
};
