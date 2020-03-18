from typing import Dict, List

from game.board import Board, as_user_mark
from game.costs import new_default_costs, Costs
from game.last_attacked import LastAttacked


class Context:
    game_id: str = ''
    member_id: str = ''

    board: Board = Board(tiles=[])
    user: Dict[int, str] = {}
    costs: Costs = new_default_costs()

    my_index: int = -1
    my_color: str = ''
    energy: int = 0

    stage: str = 'wait'  # 'wait' | 'running' | 'end'
    age: int = 0

    last_attacked: List[LastAttacked] = []  # Last 10 attacked

    def __str__(self):
        return f'[{self.stage}: {self.age}] ' + \
               f'[me: {as_user_mark(self.my_index)}({self.my_index}) energy: {self.energy}]' \
               + '\n' \
               + f'{str(self.board)}'
