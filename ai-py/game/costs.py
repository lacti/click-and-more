from dataclasses import dataclass


@dataclass
class Cost:
    base: int
    multiply: int


@dataclass
class Costs:
    new_tile: Cost
    defence: Cost
    offence: Cost
    productivity: Cost
    attack_range: Cost
    attack: Cost


def new_default_costs() -> Costs:
    return Costs(
        new_tile=Cost(base=15, multiply=0),
        defence=Cost(base=5, multiply=0),
        offence=Cost(base=20, multiply=1),
        productivity=Cost(base=10, multiply=1),
        attack_range=Cost(base=25, multiply=5),
        attack=Cost(base=4, multiply=1),
    )


def calculate_cost(meta: Cost, count: int):
    return meta.base + meta.multiply * count
