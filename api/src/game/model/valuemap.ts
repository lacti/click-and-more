export interface IValueMap {
  defence: number;
  offence: number;
  productivity: number;
  attackRange: number;
}

export const emptyValueMap = (): IValueMap => ({
  defence: 0,
  offence: 0,
  productivity: 0,
  attackRange: 0
});

export const baseValueMap = (): IValueMap => ({
  defence: 2,
  offence: 1,
  productivity: 1,
  attackRange: 1
});
