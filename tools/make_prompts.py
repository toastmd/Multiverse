"""Writes ART_PROMPTS.md: a prompt for every image in the game. Usage: python3 tools/make_prompts.py"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from art_spec import build, NEG
items = build(); root = os.path.join(os.path.dirname(__file__), '..')
L = ['# MULTIVERSE MUD art prompts', '', f'{len(items)} images. Generate each in any text-to-image tool (Midjourney, DALL-E, Stable Diffusion, Flux...), save it as `<key>.png` or `.jpg` (for example `player-magician-f.jpg`), put all files in one folder, then run:', '',
     '    python3 tools/import_art.py path/to/folder', '', 'The importer crops and resizes each file to the right shape and installs it. Rebuild the guide afterwards with `node tools/build_guide.js` if you changed guide images.', '',
     f'Negative prompt for every image: `{NEG}`', '', 'Tips: use the same style words and one seed or style reference per group (portraits, landscapes) so the set looks consistent. Make terrain textures seamless/tileable. Portraits should be tall (5:6), banners very wide (4:1), landscapes 5:2.', '']
kind = None
for key, k, files, size, prompt in items:
    if k != kind: kind = k; L += ['', f'## {k.title()} ({size[0]}x{size[1]})', '']
    L.append(f'- `{key}`: {prompt}')
open(os.path.join(root, 'ART_PROMPTS.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n'); print(len(items), 'prompts written to ART_PROMPTS.md')
