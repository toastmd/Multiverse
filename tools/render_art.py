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
        from render import portraits, scenes; portraits.run(PUB, only={'slick', 'whitlock', 'sylwen', 'okoro', 'marrow', 'cobb'}); scenes.run_new(PUB)
    if what == 'modern':
        from render import portraits; portraits.run(PUB, only={'dale', 'wanda', 'gary', 'quill', 'aldric'})
        for key, spec, seed in (('mm_man', dict(gender='male', hair='brown', acc=['stubble'], accent='orange', accent2='cyan', outfit=(60, 110, 90), skin=2, theme='modern'), 811), ('mm_woman', dict(gender='female', hair='red', acc=['glasses'], accent='pink', accent2='cyan', outfit=(150, 60, 70), skin=1, theme='modern'), 823)):
            os.makedirs(os.path.join(PUB, 'img/mob'), exist_ok=True); portraits.render(spec, seed, os.path.join(PUB, 'img/mob', key + '.jpg'))
    if what == 'remort':
        from render import portraits; portraits.run(PUB, only={f'{k}-{g}' for k in ('gambler', 'ripperdoc', 'outlaw', 'pirate') for g in 'mfn'})
    if what in ('icons', 'all'):
        from render import icons; icons.run(PUB)
