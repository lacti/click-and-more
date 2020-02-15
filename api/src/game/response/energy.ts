import { reply } from "./support/reply";

export interface IEnergyChangedResponse {
  type: "energy";
  value: number;
}

export const replyEnergy = (connectionId: string, energy: number) => {
  const replier = reply(connectionId);
  return replier<IEnergyChangedResponse>({
    type: "energy",
    value: Math.floor(energy)
  });
};
