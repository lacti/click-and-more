export const costs = {
  newTile: {
    base: 15,
    multiply: 0
  },
  defence: {
    base: 5,
    multiply: 0
  },
  offence: {
    base: 20,
    multiply: 1
  },
  productivity: {
    base: 10,
    multiply: 1
  },
  attackRange: {
    base: 25,
    multiply: 5
  },
  attack: {
    base: 4,
    multiply: 1
  }
};

export type Costs = typeof costs;
