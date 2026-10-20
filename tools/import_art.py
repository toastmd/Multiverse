"""Installs your own generated images. Usage: python3 tools/import_art.py <folder> [--dry]
Files are matched by name (see ART_PROMPTS.md): player-magician-f.png, npc-torv.jpg, area-town.webp, banner-home.png, icon-herb.png, terrain-grass.png.
Each image is centre-cropped to the right shape and resized, then written as JPEG to every place the game uses it."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image
from art_spec import build
root = os.path.join(os.path.dirname(__file__), '..'); spec = {k: (files, size) for k, _, files, size, _ in build()}
def fit(im, size):
    w, h = im.size; tw, th = size; r = max(tw / w, th / h); im = im.resize((max(tw, round(w * r)), max(th, round(h * r))), Image.LANCZOS); w, h = im.size; x, y = (w - tw) // 2, (h - th) // 2
    return im.crop((x, y, x + tw, y + th))
if len(sys.argv) < 2: sys.exit(__doc__)
folder, dry = sys.argv[1], '--dry' in sys.argv; done, unknown = 0, []
for f in sorted(os.listdir(folder)):
    stem, ext = os.path.splitext(f)
    if ext.lower() not in ('.png', '.jpg', '.jpeg', '.webp'): continue
    if stem not in spec: unknown.append(f); continue
    files, size = spec[stem]
    if not dry:
        im = fit(Image.open(os.path.join(folder, f)).convert('RGB'), size)
        for rel in files: os.makedirs(os.path.dirname(os.path.join(root, rel)), exist_ok=True); im.save(os.path.join(root, rel), 'JPEG', quality=90, optimize=True)
    done += 1
print(f'{"would install" if dry else "installed"} {done} image(s); {len(spec) - done} of {len(spec)} still use the built-in art')
if unknown: print('not recognised (check the names in ART_PROMPTS.md):', ', '.join(unknown))
