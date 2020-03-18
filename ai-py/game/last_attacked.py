from dataclasses import dataclass


@dataclass
class LastAttacked:
    fromY: int
    fromX: int
    toY: int
    toX: int
    value: int
