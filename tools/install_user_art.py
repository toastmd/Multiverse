"""Installs the pictures you supplied (tools/user_art/) under the names the game expects.
Run: python3 tools/install_user_art.py   (safe to re-run; edit the tables below to remap a picture)
  player portraits -> public/img/player/<class>-<m|f|n>.jpg   (shown in the who window and the portrait window)
  NPC portraits    -> public/img/npc/<id>.jpg
  monster pictures -> public/img/mob/<mob id>.jpg             (shown in the combat view and the portrait window)
  room pictures    -> public/img/rooms/<room id with / as ->.jpg (the static picture under the map)"""
import os, sys
import numpy as np
from PIL import Image
try: import cv2
except Exception: cv2 = None
ROOT = os.path.join(os.path.dirname(__file__), '..'); SRC = os.path.join(os.path.dirname(__file__), 'user_art'); PUB = os.path.join(ROOT, 'public')
PLAYERS = {'female_alchemist.jpg': ['alchemist-f'], 'male_alchemist.jpg': ['alchemist-m'], 'female_druid.jpg': ['druid-f'], 'male_druid.jpg': ['druid-m'], 'Female_Gambler.jpg': ['gambler-f'], 'Female_Gunslinger.png': ['gunslinger-f'],
           'male_pirate.png': ['pirate-m'], 'female_pirate.jpg': ['pirate-f'], 'male_android.png': ['android-m'], 'Female_Android.jpg': ['android-f'], 'dragon.jpg': ['dragon-m', 'dragon-f', 'dragon-n']}
NPCS = {'Sheriff.jpg': ['whitlock'], 'old_west_npc.jpg': ['cobb']}
MOBS = {'rat.jpg': ['rat'], 'goblin.png': ['goblin'], 'wolf.jpg': ['wolf']}  # add 'multimart_man.jpg': ['mm_man'], 'multimart_woman.jpg': ['mm_woman'] here once you have those pictures
OLDWEST = ['town-square', 'town-gate', 'town-eastgate', 'town-market', 'town-cobbler_lane', 'town-bakers_row', 'town-coopers_yard', 'town-back_alley', 'gulch-a', 'gulch-b', 'gulch-g', 'road-abandoned_inn']
ROOMS = {'Multimart.png': ['modern-mml', 'modern-mme'], 'gas_station.jpg': ['modern-g1p', 'modern-g1s', 'modern-g2p', 'modern-g2s'], 'toilet.jpg': ['modern-g1r', 'modern-g2r'], 'old_west_town.jpg': OLDWEST}
AREAS = {'Multimart.png': ['modern']}
def face_center(im):
    if cv2 is None: return None
    g = cv2.cvtColor(np.asarray(im.convert('RGB')), cv2.COLOR_RGB2GRAY); s = 800 / max(g.shape); g = cv2.resize(g, None, fx=s, fy=s)
    fc = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'); f = fc.detectMultiScale(g, 1.1, 5, minSize=(40, 40))
    if not len(f): return None
    x, y, w, h = max(f, key=lambda r: r[2] * r[3]); return ((x + w / 2) / s, (y + h / 2) / s, h / s)
def crop(im, ratio, focus=None, top=0.5):  # crop to w/h = ratio, centred on `focus` (x, y) when known
    w, h = im.size
    if w / h > ratio: cw, ch = int(h * ratio), h
    else: cw, ch = w, int(w / ratio)
    fx, fy = (focus[0], focus[1]) if focus else (w / 2, h * top)
    x = int(min(max(fx - cw / 2, 0), w - cw)); y = int(min(max(fy - ch * (0.38 if focus else 0.5), 0), h - ch)); return im.crop((x, y, x + cw, y + ch))
def save(im, path, size, q=90):
    os.makedirs(os.path.dirname(path), exist_ok=True); im.convert('RGB').resize(size, Image.LANCZOS).save(path, 'JPEG', quality=q, optimize=True)
def main():
    n = 0
    for f, keys in PLAYERS.items():
        im = Image.open(os.path.join(SRC, f)); c = crop(im, 360 / 432, face_center(im), 0.4)
        for k in keys: save(c, os.path.join(PUB, 'img/player', k + '.jpg'), (360, 432)); n += 1
    for f, keys in NPCS.items():
        im = Image.open(os.path.join(SRC, f)); c = crop(im, 360 / 432, face_center(im), 0.4)
        for k in keys: save(c, os.path.join(PUB, 'img/npc', k + '.jpg'), (360, 432)); n += 1
    for f, keys in MOBS.items():
        im = Image.open(os.path.join(SRC, f)); c = crop(im, 1.0, None, 0.5)
        for k in keys: save(c, os.path.join(PUB, 'img/mob', k + '.jpg'), (512, 512)); n += 1
    for f, keys in ROOMS.items():
        im = Image.open(os.path.join(SRC, f)); c = crop(im, 16 / 9, None, 0.5)
        for k in keys: save(c, os.path.join(PUB, 'img/rooms', k + '.jpg'), (800, 450)); n += 1
    for f, keys in AREAS.items():
        im = Image.open(os.path.join(SRC, f)); c = crop(im, 960 / 384, None, 0.45)
        for k in keys: save(c, os.path.join(PUB, 'guide/img', f'area-{k}.jpg'), (960, 384)); n += 1
    print(f'installed {n} pictures from tools/user_art')
if __name__ == '__main__': main()
