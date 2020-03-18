from game.ai import AiContext
from game.debug import start_debug_game
from game.main import GameMain


async def sample_ai_loop(c: AiContext):
    async def try_to_buy_one():
        if len(c.ctx.board.tiles) == 0:
            return
        for y in range(4, -1, -1):
            for x in range(4, -1, -1):
                if c.ctx.board.tiles[y][x].user_index == -1:
                    await c.request.new_tile(y, x)
                    return

    while True:
        await c.next()
        print(str(c.ctx))
        await try_to_buy_one()


if __name__ == '__main__':
    game = GameMain(ai_main=sample_ai_loop)
    start_debug_game(game_id="local_game", member1_id="mem1")
    game.start(game_id='local_game', member_id='mem1')
