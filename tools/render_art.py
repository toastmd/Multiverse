"""Renders all MULTIVERSE MUD art into public/. Usage: python3 tools/render_art.py [terrain|portraits|scenes|icons|all]
Needs numpy, scipy and Pillow. Everything is generated procedurally; nothing is downloaded."""
import os, sys, time
sys.path.insert(0, os.path.dirname(__file__))
ROOT = os.path.join(os.path.dirname(__file__), '..')
PUB = os.path.join(ROOT, 'public'); GIMG = os.path.join(PUB, 'guide', 'img')
for d in ('img/terrain', 'img/player', 'img/npc', 'guide/img'): os.makedirs(os.path.join(PUB, d), exist_ok=True)
from render.common import save_jpg

def do_terrain():
    from render import terrain
    for k, f in terrain.MAKERS.items():
        t = time.time(); a = f(); save_jpg(a, os.path.join(PUB, 'img/terrain', k + '.jpg'), 92); save_jpg(a, os.path.join(GIMG, f'terrain-{k}.jpg'), 92); print('terrain', k, round(time.time() - t, 1), 's', flush=True)

if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if what in ('terrain', 'all'): do_terrain()
    if what in ('portraits', 'all'):
        from render import portraits; portraits.run(PUB)
    if what in ('scenes', 'all'):
        from render import scenes; scenes.run(PUB)
    if what == 'newart':
        from render import portraits, scenes; portraits.run(PUB, only={'whitlock', 'sylwen', 'okoro', 'marrow', 'cobb'}); scenes.run_new(PUB)
    if what in ('icons', 'all'):
        from render import icons; icons.run(PUB)
