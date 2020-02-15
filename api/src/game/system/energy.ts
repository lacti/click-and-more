import { Board, IGameUser } from "../model";
import { Timer } from "../support/timer";

const PRODUCTION_INTERVAL = 1;

export class EnergySystem {
  private readonly users: IGameUser[];

  private readonly productionTimer: Timer;

  constructor(users: IGameUser[]) {
    this.users = users;

    this.productionTimer = new Timer(PRODUCTION_INTERVAL);
  }

  public update(dt: number, board: Board) {
    const multiple = this.productionTimer.addDt(dt);
    const productivityMap = getProductivityMap(this.users, board);

    this.users.forEach(user => {
      user.energy += multiple * productivityMap[user.index];
    });
  }
}

const getProductivityMap = (users: IGameUser[], board: Board) => {
  const productivityMap = users.reduce(
    (previousValue, currentValue) => ({
      ...previousValue,
      [currentValue.index]: 0
    }),
    {}
  );
  board.forEach(row =>
    row.forEach(tile => {
      productivityMap[tile.i] += tile.productivity;
    })
  );
  return productivityMap;
};
