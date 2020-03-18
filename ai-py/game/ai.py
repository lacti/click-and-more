from dataclasses import dataclass
from typing import Callable, Awaitable

from game.context import Context
from game.request import GameRequest

UpdateContext = Callable[[], Awaitable]


@dataclass
class AiContext:
    request: GameRequest
    ctx: Context
    next: UpdateContext


AiMain = Callable[[AiContext], Awaitable]
