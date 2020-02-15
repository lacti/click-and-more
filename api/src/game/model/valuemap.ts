export interface IValueMap {
  defence: number;
  offence: number;
  productivity: number;
  attackRange: number;
}

export const valueMapEquals = (a: IValueMap, b: IValueMap): boolean =>
  a.defence === b.defence &&
  a.offence === b.offence &&
  a.productivity === b.productivity &&
  a.attackRange === b.attackRange;

export const valueMapClone = (a: IValueMap): IValueMap => ({
  defence: a.defence,
  offence: a.offence,
  productivity: a.productivity,
  attackRange: a.attackRange
});

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
