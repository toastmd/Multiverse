"""Tileable 256px terrain textures: grass, dirt, stone, concrete, metal. Lit from heightmaps, with grain, wear and detail."""
import math, random
import numpy as np
from PIL import Image, ImageDraw
from .common import *

N = 256

def grass(seed=11):
    r = random.Random(seed); base = fbm(N, N, seed, 40, 4, True)
    col = ramp(n01(base), [(0, (18, 48, 16)), (.5, (40, 92, 28)), (1, (78, 136, 46))])
    S = N * 2; im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for _ in range(6500):
        x, y = r.random() * S, r.random() * S; ln = r.uniform(9, 26); ang = r.uniform(-.55, .55) - math.pi / 2; bend = r.uniform(-7, 7); g = r.randint(55, 205)
        c = (int(g * r.uniform(.4, .6)), g, int(g * r.uniform(.2, .35)), r.randint(140, 255))
        pts = [(x, y), (x + bend * .5 + math.cos(ang) * ln * .5, y + math.sin(ang) * ln * .5), (x + bend + math.cos(ang) * ln, y + math.sin(ang) * ln)]
        for ox in (-S, 0, S):
            for oy in (-S, 0, S): d.line([(px + ox, py + oy) for px, py in pts], fill=c, width=2)
    bl = im.resize((N, N), Image.LANCZOS); a = np.asarray(bl, np.float32) / 255; rgb, al = a[..., :3], a[..., 3]
    ao = 1 - 0.35 * blur(al, 2.2, True)[..., None]
    out = comp(col * ao, rgb, np.clip(al * 1.1, 0, 1)); out = out * (0.85 + 0.3 * n01(fbm(N, N, seed + 3, 14, 3, True)))[..., None]
    return np.clip(out, 0, 1)

def dirt(seed=21):
    r = random.Random(seed); h = fbm(N, N, seed, 22, 6, True)
    S = N * 2; hm = Image.new('L', (S, S), 0); d = ImageDraw.Draw(hm); cols = Image.new('RGB', (S, S), (0, 0, 0)); dc = ImageDraw.Draw(cols)
    for _ in range(700):
        x, y = r.random() * S, r.random() * S; rad = r.uniform(2, 8); g = r.randint(100, 210); c = (g, int(g * .88), int(g * .75))
        for ox in (-S, 0, S):
            for oy in (-S, 0, S): d.ellipse([x + ox - rad, y + oy - rad * .8, x + ox + rad, y + oy + rad * .8], fill=255); dc.ellipse([x + ox - rad, y + oy - rad * .8, x + ox + rad, y + oy + rad * .8], fill=c)
    peb = blur(mask_from(hm.resize((N, N), Image.LANCZOS)), 1.2, True); pc = from_img(cols.resize((N, N), Image.LANCZOS)); pm = np.clip(peb * 3, 0, 1)
    height = h * .5 + peb * 1.4 + fbm(N, N, seed + 2, 2, 2, True) * .12
    col = ramp(n01(h), [(0, (52, 34, 20)), (.5, (104, 72, 42)), (1, (150, 112, 70))])
    col = comp(col, pc * .8, pm * .7); sh = lit(height, strength=3.2, wrap=True)
    return np.clip(col * (0.45 + 0.75 * sh)[..., None] * (0.9 + 0.2 * n01(fbm(N, N, seed + 5, 3, 2, True)))[..., None], 0, 1)

def stone(seed=31):
    r = np.random.default_rng(seed); pts = r.random((46, 2)) * N; best = np.full((N, N), 1e9, np.float32); second = best.copy(); idx = np.zeros((N, N), np.int32)
    y, x = np.mgrid[0:N, 0:N].astype(np.float32)
    for i, (px, py) in enumerate(pts):
        dx = np.abs(x - px); dx = np.minimum(dx, N - dx); dy = np.abs(y - py); dy = np.minimum(dy, N - dy); dd = np.sqrt(dx * dx + dy * dy)
        m = dd < best; second = np.where(m, best, np.minimum(second, dd)); idx = np.where(m, i, idx); best = np.minimum(best, dd)
    edge = np.clip((second - best) / 3.2, 0, 1); tone = r.random(46).astype(np.float32)[idx]; elev = r.random(46).astype(np.float32)[idx]
    h = elev * .35 + edge * .5 + fbm(N, N, seed, 5, 4, True) * .18 + fbm(N, N, seed + 1, 1.5, 2, True) * .05
    col = ramp(np.clip(.25 + tone * .5 + fbm(N, N, seed + 2, 8, 3, True) * .15, 0, 1), [(0, (58, 60, 66)), (.5, (104, 106, 110)), (1, (150, 148, 142))])
    tint = (r.random((46, 3)).astype(np.float32) * .03 - .015)[idx]; col = col + tint
    col = col * (0.25 + 0.75 * edge)[..., None]; sh = lit(h, strength=4.0, wrap=True)
    moss = np.clip(fbm(N, N, seed + 9, 18, 3, True) - .55, 0, 1) * (1 - edge * .6); col = comp(col, (52, 76, 40), np.clip(moss * 1.5, 0, .5))
    return np.clip(col * (0.5 + 0.7 * sh)[..., None], 0, 1)

def concrete(seed=41):
    h = fbm(N, N, seed, 1.2, 3, True) * .5 + fbm(N, N, seed + 1, 9, 4, True) * .3
    col = ramp(n01(fbm(N, N, seed + 2, 28, 4, True)), [(0, (118, 118, 114)), (.6, (146, 145, 140)), (1, (168, 166, 160))])
    stain = np.clip(fbm(N, N, seed + 3, 24, 3, True) - .4, 0, 1); col = comp(col, (88, 82, 74), np.clip(stain * .8, 0, .5))
    im = Image.new('L', (N * 2, N * 2), 0); d = ImageDraw.Draw(im); r = random.Random(seed)
    for _ in range(7):
        x, y = r.random() * N * 2, r.random() * N * 2; pts = [(x, y)]
        for _ in range(r.randint(12, 30)): x += r.uniform(-9, 9); y += r.uniform(2, 9) * r.choice([1, 1, -1]) * (1 if r.random() < .6 else .4); pts.append((x, y))
        d.line(pts, fill=255, width=2)
    crack = blur(mask_from(im.resize((N, N), Image.LANCZOS)), .7, True)
    joint = np.zeros((N, N), np.float32); joint[N // 2 - 1:N // 2 + 1, :] = 1; joint[:, N // 2 - 1:N // 2 + 1] = 1; joint[0:1, :] = 1; joint[:, 0:1] = 1; joint = blur(joint, 1.1, True)
    pits = (np.random.default_rng(seed).random((N, N)) > .997).astype(np.float32); pits = blur(pits, 1.0, True) * 6
    height = h - joint * .8 - crack * .7 - pits * .25; col = col * (1 - .6 * np.clip(joint + crack * .8 + pits, 0, 1))[..., None]
    sh = lit(height, strength=3.0, wrap=True); return np.clip(col * (0.55 + 0.6 * sh)[..., None], 0, 1)

def metal(seed=51):
    r = np.random.default_rng(seed); streak = gaussian_filter(r.random((N, N)).astype(np.float32), (.5, 22), mode='wrap'); streak = (streak - streak.mean()) / (streak.std() + 1e-6)
    h = streak * .06 + fbm(N, N, seed, 30, 3, True) * .04
    y, x = np.mgrid[0:N, 0:N].astype(np.float32); seam = np.zeros((N, N), np.float32); seam[N // 2 - 1:N // 2 + 1, :] = 1; seam[:, 0:2] = 1; seam = blur(seam, 1.0, True)
    riv = np.zeros((N, N), np.float32)
    for cy in (22, N // 2 - 22, N // 2 + 22, N - 22):
        for cx in (22, N - 22, N // 2):
            dx = np.minimum(np.abs(x - cx), N - np.abs(x - cx)); dy = np.minimum(np.abs(y - cy), N - np.abs(y - cy)); riv += np.exp(-(dx * dx + dy * dy) / 26) * 1.0
    height = h - seam * .06 + riv * .22; sh = lit(height, strength=9.0, wrap=True)
    base = ramp(n01(fbm(N, N, seed + 4, 60, 2, True)), [(0, (92, 100, 112)), (1, (150, 160, 172))]); base = base * (0.8 + 0.4 * (streak * .1 + .5))[..., None]
    sc = Image.new('L', (N * 2, N * 2), 0); d = ImageDraw.Draw(sc); rr = random.Random(seed)
    for _ in range(90):
        x0, y0 = rr.random() * N * 2, rr.random() * N * 2; ang = rr.uniform(-.25, .25); ln = rr.uniform(10, 50); d.line([(x0, y0), (x0 + math.cos(ang) * ln, y0 + math.sin(ang) * ln)], fill=rr.randint(70, 200), width=1)
    scr = mask_from(sc.resize((N, N), Image.LANCZOS)); out = base * (0.4 + 0.8 * sh)[..., None]; out = comp(out, (205, 212, 222), np.clip(scr * .6, 0, .6))
    spec = np.exp(-((y / N - .35) ** 2) / .02) * .12; out = out + spec[..., None] * (streak * .08 + 1)[..., None]
    out = comp(out, (30, 34, 40), np.clip(seam * .85, 0, .85)); dark = np.clip(fbm(N, N, seed + 7, 26, 3, True) - .6, 0, 1); out = comp(out, (88, 64, 44), np.clip(dark * 1.0, 0, .22))
    return np.clip(out, 0, 1)

MAKERS = {'grass': grass, 'dirt': dirt, 'stone': stone, 'concrete': concrete, 'metal': metal}
