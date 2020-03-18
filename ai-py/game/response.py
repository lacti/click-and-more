from typing import List

from game.board import Tile
from game.context import Context
from game.costs import Cost
from game.last_attacked import LastAttacked


def apply_response(ctx: Context, res):
    if res['type'] == 'enter':
        apply_enter(ctx, res)
    elif res['type'] == 'leave':
        apply_leave(ctx, res)
    elif res['type'] == 'load':
        apply_load(ctx, res)
    elif res['type'] == 'stage':
        apply_stage(ctx, res)
    elif res['type'] == 'changed':
        apply_changed(ctx, res)
    elif res['type'] == 'energy':
        apply_energy(ctx, res)
    elif res['type'] == 'attack':
        apply_attack(ctx, res)
    elif res['type'] == 'end':
        apply_end(ctx, res)
    else:
        print(f'Unknown response: ' + res['type'])
        print(res)


def apply_enter(ctx: Context, res):
    ctx.user[res['newbie']['index']] = res['newbie']['color']


def apply_leave(ctx: Context, res):
    del ctx.user[res['leaver']['index']]


def apply_load(ctx: Context, res):
    for user in res['users']:
        ctx.user[user['index']] = user['color']

    for y, res_row in enumerate(res['board']):
        tile_row: List[Tile] = []
        for x, res_col in enumerate(res_row):
            tile = Tile(user_index=res_col['i'],
                        y=y,
                        x=x,
                        defence=res_col['defence'],
                        offence=res_col['offence'],
                        productivity=res_col['productivity'],
                        attack_range=res_col['attackRange'])
            tile_row.append(tile)
        ctx.board.tiles.append(tile_row)

    def parse_cost(key: str):
        return Cost(base=res['costs'][key]['base'], multiply=res['costs'][key]['multiply'])

    ctx.costs.new_tile = parse_cost('newTile')
    ctx.costs.defence = parse_cost('defence')
    ctx.costs.offence = parse_cost('offence')
    ctx.costs.productivity = parse_cost('productivity')
    ctx.costs.attack_range = parse_cost('attackRange')
    ctx.costs.attack = parse_cost('attack')

    ctx.my_index = res['me']['index']
    ctx.my_color = res['me']['color']
    ctx.energy = res['energy']

    ctx.stage = res['stage']
    ctx.age = res['age']


def apply_stage(ctx: Context, res):
    ctx.stage = res['stage']
    ctx.age = res['age']
    ctx.energy = res['energy']


def apply_changed(ctx: Context, res):
    for sync in res['data']:
        tile = ctx.board.tiles[sync['y']][sync['x']]
        tile.user_index = sync['i']
        tile.defence = sync['defence']
        tile.offence = sync['offence']
        tile.productivity = sync['productivity']
        tile.attack_range = sync['attackRange']


def apply_energy(ctx: Context, res):
    ctx.energy = res['value']


def apply_attack(ctx: Context, res):
    attacked = LastAttacked(
        fromY=res['from']['y'],
        fromX=res['from']['x'],
        toY=res['to']['y'],
        toX=res['to']['x'],
        value=res['value']
    )
    ctx.last_attacked.insert(0, attacked)
    while len(ctx.last_attacked) > 10:
        ctx.last_attacked.pop()


def apply_end(ctx: Context, res):
    ctx.stage = 'end'
    print(res['score'])
