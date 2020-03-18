import asyncio
import json
import traceback

import websockets

from game.ai import AiMain, AiContext
from game.context import Context
from game.debug import new_debug_connection_url
from game.request import GameRequest
from game.response import apply_response


class GameMain:
    def __init__(self, ai_main: AiMain):
        self.ai_main = ai_main

    def start(self, game_id: str, member_id: str):
        asyncio.get_event_loop().run_until_complete(
            self._socket_main(new_debug_connection_url(game_id, member_id)))

    async def _socket_main(self, uri: str):
        # Wait until preparing the game.
        await asyncio.sleep(1)

        # Start the socket loop.
        ctx = Context()
        connected = False
        async with websockets.connect(uri) as websocket:
            connected = True

            # Update socket
            request = GameRequest(websocket)

            # Wait until preparing the connection information.
            await asyncio.sleep(1)

            async def update_context():
                if not connected:
                    return
                res = await websocket.recv()
                apply_response(ctx, json.loads(res))

            try:
                # Start to load context
                await websocket.send(json.dumps({"type": "load"}))

                # Start ai loop
                await self.ai_main(AiContext(
                    request=request,
                    ctx=ctx,
                    next=update_context
                ))

                # End of game
                await websocket.close()
            except websockets.ConnectionClosedError:
                connected = False
                print("End-of-game")

            except Exception as e:
                connected = False
                print("Error occurred in game running")
                print(type(e))
                print(e)
                traceback.print_exc()
