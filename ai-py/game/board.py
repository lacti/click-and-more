from dataclasses import dataclass
from typing import List

USER_MARKS = ' @#%$*&'


def as_user_mark(user_index: int):
    if user_index > 0:
        return USER_MARKS[user_index]
    return ' '


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

    def as_mark(self):
        user_mark = as_user_mark(self.user_index)
        return '[{0}]'.format(user_mark)

    def as_stat(self):
        return '[{0:d}/{1:d}/{2:d}/{3:d}]'.format(self.defence, self.offence, self.productivity, self.attack_range)


@dataclass
class Board:
    tiles: List[List[Tile]]

    def __str__(self):
        table: List[str] = []
        for row in self.tiles:
            marks: List[str] = []
            stats: List[str] = []
            for tile in row:
                marks.append(tile.as_mark())
                stats.append(tile.as_stat())
            table.append(''.join(marks) + ' ' + ''.join(stats))
        return '\n'.join(table)
