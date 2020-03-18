import json

import requests


def start_debug_game(game_id: str, member1_id: str):
    requests.post("http://localhost:3000/debug", data=json.dumps({
        "gameId": game_id,
        "members": [
            {"memberId": member1_id},
            {"memberId": "observer", "observer": True},
        ]
    }))


def new_debug_connection_url(game_id: str, member_id: str):
    return f"ws://localhost:3001/?x-game-id={game_id}&x-member-id={member_id}"
