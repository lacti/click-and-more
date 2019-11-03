import { GameStage } from "../model/stage";

export default class Ticker {
  private readonly startMillis: number = Date.now();
  private ageBefore: number = -1;

  constructor(
    public readonly stage: GameStage,
    private readonly aliveMillis: number
  ) {}

  public get age() {
    return this.calculateAge();
  }

  public isAlive = () => this.elapsed() < this.aliveMillis;

  public checkAgeChanged = async (
    onChanged: (stage: GameStage, age: number) => Promise<any>
  ) => {
    const newAge = this.calculateAge();
    if (this.ageBefore === newAge) {
      return;
    }
    this.ageBefore = newAge;
    await onChanged(this.stage, newAge);
  };

  private calculateAge = () => Math.floor(this.elapsed() / 1000);

  private elapsed = () => Date.now() - this.startMillis;
}
