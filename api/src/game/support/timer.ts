export class Timer {
  private readonly interval: number;

  private acc: number = 0;

  constructor(interval: number) {
    this.interval = interval;
  }

  public addDt(dt: number): number {
    const { multiple, remain } = processTimer(this.interval, this.acc, dt);
    this.acc = remain;
    return multiple;
  }
}

export const processTimer = (
  interval: number,
  oldTimer: number,
  dt: number
): { multiple: number; remain: number } => {
  const newTimer = oldTimer + dt;
  const multiple = Math.floor(newTimer / interval);
  const remain = newTimer % interval;
  return { multiple, remain };
};
