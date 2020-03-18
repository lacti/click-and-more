import json

from websockets import WebSocketClientProtocol


class GameRequest:
    def __init__(self, socket: WebSocketClientProtocol):
        self.socket = socket

    async def new_tile(self, y: int, x: int):
        await self.socket.send(json.dumps({"type": "new", "y": y, "x": x}))

    async def upgrade_defence(self, y: int, x: int):
        await self.socket.send(json.dumps({"type": "defenceUp", "y": y, "x": x}))

    async def upgrade_offence(self, y: int, x: int):
        await self.socket.send(json.dumps({"type": "offenceUp", "y": y, "x": x}))

    async def upgrade_productivity(self, y: int, x: int):
        await self.socket.send(json.dumps({"type": "productivityUp", "y": y, "x": x}))

    async def upgrade_attack_range(self, y: int, x: int):
        await self.socket.send(json.dumps({"type": "attackRangeUp", "y": y, "x": x}))

    async def attack(self, from_y: int, from_x: int, to_y: int, to_x: int):
        await self.socket.send(json.dumps({"type": "attack",
                                           "from": {"y": from_y, "x": from_x},
                                           "to": {"y": to_y, "x": to_x}}))
