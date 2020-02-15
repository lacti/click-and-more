import { IGameUser } from "../model";
import { Timer } from "../support/timer";

const PRODUCTION_INTERVAL = 1;

export class EnergySystem {
  private readonly users: IGameUser[];

  private readonly productionTimer: Timer;

  constructor(users: IGameUser[]) {
    this.users = users;

    this.productionTimer = new Timer(PRODUCTION_INTERVAL);
  }

  public update(dt: number) {
    const multiple = this.productionTimer.addDt(dt);

    this.users.forEach(user => {
      user.energy += multiple * user.productivity;
    });
  }
}
