from dataclasses import dataclass
from typing import List


@dataclass
class Tile:
    user_index: int
    y: int
    x: int
    defence: int
    offence: int
    productivity: int
    attack_range: int

    def is_owned(self):
        return self.user_index > 0

    def __str__(self):
        user_mark = ' '
        if self.user_index > 0:
            user_mark = ' @#%$*&'[self.user_index]
        return '[{0} {1:2d}/{2:2d}/{3:2d}/{4:2d}]'.format(user_mark, self.defence, self.offence, self.productivity,
                                                          self.attack_range)


@dataclass
class Board:
    tiles: List[List[Tile]]

    def __str__(self):
        table: List[str] = []
        for row in self.tiles:
            tr: List[str] = []
            for tile in row:
                tr.append(str(tile))
            table.append(''.join(tr))
        return '\n'.join(table)
