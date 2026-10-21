"""Portrait renderer: skin, eyes, hair strands, clothing and cyber accessories are drawn at 2x, lit with soft 3D shading,
rim-lit in neon, bloomed, graded and downsampled. Output ~360x432 JPEGs for every class x gender and every NPC."""
import math, random, os, time
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from .common import *

W, H = 720, 864
SKIN = [(248, 218, 192), (238, 194, 158), (216, 164, 122), (178, 122, 82), (132, 88, 58), (96, 64, 44)]
HAIRC = {'black': (24, 22, 28), 'brown': (74, 48, 32), 'auburn': (122, 54, 36), 'blond': (198, 162, 96), 'grey': (170, 170, 178), 'white': (224, 224, 232), 'blue': (44, 96, 216), 'pink': (228, 74, 172), 'cyan': (36, 202, 228), 'red': (184, 40, 44), 'violet': (124, 64, 194)}
NEON = {'pink': (255, 79, 216), 'cyan': (25, 227, 255), 'gold': (255, 211, 74), 'green': (123, 224, 160), 'orange': (255, 122, 60), 'violet': (154, 107, 255), 'red': (255, 80, 70)}

def M(fn):
    im = Image.new('L', (W, H), 0); fn(ImageDraw.Draw(im)); return blur(mask_from(im), 0.9)
def ell(cx, cy, rx, ry): return lambda d: d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=255)
def soft(cx, cy, rx, ry, s): return blur(M(ell(cx, cy, rx, ry)), s)
def poly(pts): return lambda d: d.polygon(pts, fill=255)

def shade(cv, mask, base, light=(-.5, -.7, .55), relief=14, amb=.42, spec=0.0, tex=None, alpha=1.0):
    h = blur(mask, relief) * relief * 1.1
    if tex is not None: h = h + tex
    s = lit(h, light, 1.5); b = np.array(base, np.float32).reshape(1, 1, 3) / 255.0
    col = b * (amb + (1 - amb) * s)[..., None]
    if spec: col = col + spec * np.clip(s - .72, 0, 1)[..., None] * 2.5
    return comp(cv, np.clip(col, 0, 1), mask * alpha)

def glow(cv, mask, color, k=1.0, s=14):
    g = blur(mask, s)[..., None] * (np.array(color, np.float32) / 255.0).reshape(1, 1, 3) * k
    return screen(cv, g)

def background(seed, accent, accent2, theme='scifi'):
    if theme == 'modern': accent, accent2 = (90, 170, 255), (255, 160, 80)
    elif theme == 'west': accent, accent2 = (255, 160, 80), (255, 205, 130)
    elif theme == 'fantasy': accent, accent2 = (110, 200, 130), (255, 215, 130)
    r = np.random.default_rng(seed); y = np.linspace(0, 1, H)[:, None, None]
    top = np.array({'west': [40, 20, 22], 'fantasy': [8, 18, 20], 'scifi': [14, 8, 28], 'modern': [26, 30, 40]}[theme], np.float32) / 255; bot = np.array({'west': [120, 62, 36], 'fantasy': [26, 44, 34], 'scifi': [34, 14, 52], 'modern': [74, 84, 100]}[theme], np.float32) / 255
    cv = (top * (1 - y) + bot * y) * np.ones((1, W, 3), np.float32)
    cv = cv + (np.array(accent2, np.float32) / 255 * 0.10) * np.clip(1 - np.abs(np.linspace(-1, 1, W))[None, :, None] * 1.2, 0, 1) * (1 - y)
    im = Image.new('RGB', (W, H), (0, 0, 0)); d = ImageDraw.Draw(im)
    for _ in range(46):
        x, yy, rad = r.random() * W, r.random() * H * .8 + H * .05, r.uniform(16, 70); c = [accent, accent2, (255, 190, 90), (120, 220, 255)][r.integers(4)]; f = r.uniform(.25, .7)
        d.ellipse([x - rad, yy - rad, x + rad, yy + rad], fill=tuple(int(v * f) for v in c))
    bk = blur(from_img(im), 9); cv = screen(cv, bk * .75)
    if theme != 'scifi': return cv
    sky = Image.new('RGB', (W, H), (0, 0, 0)); d = ImageDraw.Draw(sky); x = 0
    while x < W:
        bw = r.integers(50, 120); bh = r.integers(140, 440); d.rectangle([x, H - bh, x + bw, H], fill=(10, 6, 20)); x += bw + 4
        for _ in range(int(bw * bh / 1400)):
            if r.random() < .5: wx = x - bw + r.integers(6, max(7, bw - 6)); wy = H - bh + r.integers(8, max(9, bh - 8)); d.rectangle([wx, wy, wx + 6, wy + 9], fill=tuple(int(v * .6) for v in [accent, accent2, (255, 210, 120)][r.integers(3)]))
    sk = blur(from_img(sky), 7); cv = comp(cv, sk, np.clip(np.asarray(sky.convert('L'), np.float32) / 255 * 3, 0, 1) * 0.9 + 0) * 0 + np.where(sk.sum(-1, keepdims=True) > 0.02, sk * 0.9 + cv * 0.1, cv)
    return cv

def head_mask(cx, cy, a, b, jaw):
    pts = []
    for t in np.linspace(0, 2 * math.pi, 260):
        x, y = math.cos(t), math.sin(t)
        if y > 0: x *= 1 - (1 - jaw) * (y ** 1.7)
        pts.append((cx + a * x, cy + b * y))
    return M(poly(pts))

def render(spec, seed, path):
    t0 = time.time(); rnd = random.Random(seed); R = np.random.default_rng(seed)
    g = spec['gender']; skin = SKIN[spec.get('skin', seed % 6)]; hair = HAIRC[spec.get('hair', 'black')]; acc = spec.get('acc', []); style = spec.get('style', {'male': 'short', 'female': 'long', 'nonbinary': 'side'}[g])
    A = NEON[spec.get('accent', 'cyan')]; A2 = NEON[spec.get('accent2', 'pink')]; outfit = spec.get('outfit', (46, 38, 70)); eyec = spec.get('eyes', [(70, 110, 160), (80, 52, 30), (60, 120, 80), (110, 110, 120)][seed % 4])
    cv = background(seed, A, A2, spec.get('theme', 'scifi')); cx, cy = W // 2, 372; a = {'male': 150, 'female': 138, 'nonbinary': 144}[g]; b = 188; jaw = {'male': .86, 'female': .66, 'nonbinary': .76}[g]
    # --- torso, neck ---
    sh = {'male': 330, 'female': 270, 'nonbinary': 300}[g]
    torso = M(poly([(cx - 60, 585), (cx - sh * .55, 640), (cx - sh * 1.0, 700), (cx - sh * 1.1, H), (cx + sh * 1.1, H), (cx + sh * 1.0, 700), (cx + sh * .55, 640), (cx + 60, 585)]))
    fab = fbm(H, W, seed, 2, 3) * .5 + fbm(H, W, seed + 1, 40, 3) * 2.2
    cv = shade(cv, torso, outfit, relief=40, amb=.38, tex=fab * 0.5)
    vneck = M(poly([(cx - 70, 600), (cx, 760), (cx + 70, 600)])); cv = shade(cv, vneck, tuple(int(v * .35) for v in outfit), relief=10, amb=.5)
    pipe = np.zeros((H, W), np.float32); im = Image.new('L', (W, H), 0); d = ImageDraw.Draw(im)
    d.line([(cx - 74, 596), (cx, 768), (cx + 74, 596)], fill=255, width=5); d.line([(cx - sh * .55, 640), (cx - sh * 1.0, 700)], fill=255, width=5); d.line([(cx + sh * .55, 640), (cx + sh * 1.0, 700)], fill=255, width=5); pipe = blur(mask_from(im), .8)
    cv = comp(cv, np.array(A, np.float32) / 255, pipe * .9); cv = glow(cv, pipe, A, .9, 8)
    if 'pauldron' in acc:
        for sgn in (-1, 1):
            m = M(ell(cx + sgn * sh * .86, 676, 74, 44)); cv = shade(cv, m, (92, 98, 112), relief=20, amb=.32, spec=.9); cv = glow(cv, M(ell(cx + sgn * sh * .86, 662, 34, 4)), A, .5, 6)
    neck = M(poly([(cx - 62, 470), (cx + 62, 470), (cx + 70, 610), (cx - 70, 610)])); cv = shade(cv, neck, tuple(int(v * .9) for v in skin), relief=30, amb=.4)
    chin_sh = soft(cx, 560, 120, 40, 22); cv = cv * (1 - .38 * chin_sh[..., None] * neck[..., None])
    # --- hood back / aura ---
    if 'glow' in acc: cv = glow(cv, soft(cx, cy, a * 1.9, b * 1.4, 70), A, .55, 40)
    # --- head ---
    hm = head_mask(cx, cy, a, b, jaw); ear = lambda s: M(ell(cx + s * (a + 4), cy + 26, 20, 36))
    for s in (-1, 1): cv = shade(cv, ear(s), tuple(int(v * .92) for v in skin), relief=8, amb=.5)
    cv = shade(cv, hm, skin, light=(-.45, -.75, .5), relief=60, amb=.52, tex=fbm(H, W, seed + 3, 1.2, 2) * 0.10)
    skin_tone = np.array(skin, np.float32) / 255
    blotch = fbm(H, W, seed + 4, 30, 3) * .035; cv = cv + (blotch * hm)[..., None] * np.array([.8, .35, .3], np.float32)
    cv = cv * (1 + 0.018 * fbm(H, W, seed + 5, 1.0, 1) * hm)[..., None]
    cheek = soft(cx - 85, cy + 62, 46, 28, 22) + soft(cx + 85, cy + 62, 46, 28, 22); cv = comp(cv, np.array([210, 100, 96], np.float32) / 255, np.clip(cheek * .22 * hm, 0, .3))
    jawsh = np.clip(hm - blur(M(ell(cx, cy - 22, a * .98, b * .98)), 10), 0, 1); cv = cv * (1 - .35 * jawsh[..., None]); rim = np.clip(blur(hm, 5) - blur(np.roll(hm, -16, 1), 5), 0, 1); cv = screen(cv, rim[..., None] * (np.array(A, np.float32) / 255).reshape(1, 1, 3) * .75)
    # --- face features on a 2x layer ---
    ey = cy - 12; ex = 64; lid = (skin_tone * .55)
    for s in (-1, 1):
        cv = cv * (1 - .30 * soft(cx + s * ex, ey - 6, 54, 30, 14)[..., None] * hm[..., None])
        op = M(lambda d, s=s: d.polygon([(cx + s * ex - 44, ey + 4), (cx + s * ex - 14, ey - 16), (cx + s * ex + 20, ey - 17), (cx + s * ex + 46, ey + 2), (cx + s * ex + 16, ey + 15), (cx + s * ex - 16, ey + 14)], fill=255))
        eyeball = shade(np.zeros((H, W, 3), np.float32) + np.array([230, 224, 220], np.float32) / 255, op, (236, 230, 226), relief=10, amb=.55)
        ir = M(ell(cx + s * ex + s * 2, ey, 19, 19)); iris = shade(eyeball, ir, eyec, relief=8, amb=.7, tex=fbm(H, W, seed + 6, 1.2, 2) * 0.15)
        iris = comp(iris, np.array([8, 6, 10], np.float32) / 255, M(ell(cx + s * ex + s * 2, ey, 8, 8)))
        iris = comp(iris, np.array([255, 255, 255], np.float32) / 255, M(ell(cx + s * ex - 6, ey - 7, 4.5, 4.5)) * .95)
        shadow_top = np.clip(op - np.roll(op, 9, 0), 0, 1); iris = iris * (1 - .55 * blur(shadow_top, 3)[..., None])
        cv = comp(cv, iris, op); L1 = M(lambda d, s=s: d.line([(cx + s * ex - 46, ey + 4), (cx + s * ex - 14, ey - 17), (cx + s * ex + 20, ey - 18), (cx + s * ex + 48, ey + 2)], fill=255, width=5))
        cv = comp(cv, lid * .35, L1 * .9); cv = comp(cv, lid * .6, M(lambda d, s=s: d.line([(cx + s * ex - 16, ey + 15), (cx + s * ex + 16, ey + 16)], fill=255, width=2)) * .45)
        if g == 'female':
            lash = M(lambda d, s=s: [d.line([(cx + s * ex - 30 + i * 12, ey - 14 - abs(i - 2)), (cx + s * ex - 33 + i * 12, ey - 24 - abs(i - 2) * 2)], fill=255, width=2) for i in range(6)]); cv = comp(cv, (14, 10, 14), lash * .8)
        thick = {'male': 12, 'female': 7, 'nonbinary': 9}[g]; bro = M(lambda d, s=s: d.line([(cx + s * ex - 40, ey - 36), (cx + s * ex - 6, ey - 46), (cx + s * ex + 44, ey - 38)], fill=255, width=thick)); bro = blur(bro, 1.6)
        cv = comp(cv, np.array(hair, np.float32) / 255 * .8, bro * .92)
    # nose
    cv = cv * (1 - .26 * soft(cx - 30, cy + 56, 14, 30, 8)[..., None] * hm[..., None]); cv = cv * (1 - .26 * soft(cx + 34, cy + 56, 12, 30, 9)[..., None] * hm[..., None])
    cv = comp(cv, np.clip(skin_tone * 1.12, 0, 1), soft(cx - 8, cy + 12, 10, 46, 9) * .35 * hm); cv = comp(cv, np.clip(skin_tone * 1.15, 0, 1), soft(cx - 4, cy + 62, 18, 12, 6) * .35)
    for s in (-1, 1): cv = comp(cv, (40, 20, 22), soft(cx + s * 17, cy + 70, 8, 5, 3) * .7)
    # mouth
    my = cy + 118; lipc = {'male': (176, 98, 90), 'female': (200, 70, 96), 'nonbinary': (186, 84, 92)}[g]
    if 'lip' in spec: lipc = spec['lip']
    up = M(lambda d: d.polygon([(cx - 52, my), (cx - 20, my - 14), (cx, my - 8), (cx + 20, my - 14), (cx + 52, my), (cx, my + 5)], fill=255)); lo = M(lambda d: d.polygon([(cx - 50, my + 1), (cx, my + 5), (cx + 50, my + 1), (cx + 34, my + 26), (cx, my + 32), (cx - 34, my + 26)], fill=255))
    cv = shade(cv, lo, lipc, relief=7, amb=.6, spec=.5); cv = shade(cv, up, tuple(int(v * .88) for v in lipc), relief=6, amb=.5, spec=.3)
    cv = comp(cv, (60, 22, 28), M(lambda d: d.line([(cx - 52, my + 2), (cx, my + 6), (cx + 52, my + 2)], fill=255, width=3)) * .85)
    cv = cv * (1 - .22 * soft(cx, my + 44, 40, 12, 10)[..., None] * hm[..., None])
    if g == 'male' or 'stubble' in acc: cv = comp(cv, np.array(hair, np.float32) / 255 * .6, np.clip(hm * (soft(cx, cy + 130, a * .95, 90, 30)) * 0.18 * (R.random((H, W)).astype(np.float32) > .45), 0, .2))
    # --- beard ---
    if 'beard' in acc:
        bm = np.clip(M(poly([(cx - a * .95, cy + 20), (cx - a * .8, cy + b * .95), (cx, cy + b * 1.18), (cx + a * .8, cy + b * .95), (cx + a * .95, cy + 20), (cx + 50, my - 14), (cx, my - 4), (cx - 50, my - 14)])) , 0, 1)
        cv = shade(cv, bm, hair, relief=24, amb=.4, tex=fbm(H, W, seed + 8, .9, 2) * 0.3)
        im = Image.new('L', (W, H), 0); d = ImageDraw.Draw(im)
        for _ in range(1400): x = cx + R.uniform(-a * .9, a * .9); y = R.uniform(cy + 30, cy + b * 1.1); d.line([(x, y), (x + R.uniform(-5, 5), y + R.uniform(8, 20))], fill=int(R.integers(90, 255)), width=1)
        sm = blur(mask_from(im), .5) * bm; cv = comp(cv, np.array(hair, np.float32) / 255 * 1.35 + .05, np.clip(sm * .7, 0, .8))
    # --- hair ---
    hair_hidden = any(k in acc for k in ('helmet', 'hood', 'hat', 'turban', 'flame'))
    if not hair_hidden:
        top = cy - b * 1.04
        if style in ('short', 'side'):
            cap = M(lambda d: d.chord([cx - a * 1.14, top - 6, cx + a * 1.14, cy + 6], 180, 360, fill=255)) * (1 - soft(cx, cy + 60, a * .92, 150, 16) * 0.0)
            cap = np.clip(cap - M(ell(cx, cy + 40, a * .86, b * .76)) * .98, 0, 1) if style == 'short' else cap
            fring = M(lambda d: d.polygon([(cx - a * 1.1, cy - 70), (cx - a * .2, cy - 118), (cx + a * 1.15, cy - 50), (cx + a * 1.1, cy - 160), (cx, top - 14), (cx - a * 1.1, cy - 160)], fill=255))
            hairmask = np.clip(cap + fring * .0 + M(ell(cx, cy - 100, a * 1.1, b * .72)) * (1 - M(ell(cx, cy + 40, a * .92, b * .8))), 0, 1)
            if style == 'side': hairmask = np.clip(hairmask + M(poly([(cx - a * 1.2, cy - 140), (cx - a * 1.3, cy + 60), (cx - a * 1.05, cy + 70), (cx - a * .6, cy - 70)])), 0, 1)
        else:
            hairmask = np.clip(M(ell(cx, cy - 100, a * 1.28, b * .8)) * (1 - M(ell(cx, cy + 36, a * .90, b * .80))) + M(poly([(cx - a * 1.22, cy - 30), (cx - a * 1.5, 640), (cx - a * 1.0, 700), (cx - a * .86, cy + 160), (cx - a * .8, cy + 20)])) + M(poly([(cx + a * 1.22, cy - 30), (cx + a * 1.5, 640), (cx + a * 1.0, 700), (cx + a * .86, cy + 160), (cx + a * .8, cy + 20)])), 0, 1)
        cv = shade(cv, hairmask, tuple(int(v * .62) for v in hair), relief=30, amb=.4)
        im = Image.new('L', (W, H), 0); d = ImageDraw.Draw(im); lo = Image.new('L', (W, H), 0); dl = ImageDraw.Draw(lo)
        for _ in range(3300):
            th = R.uniform(math.pi * 1.02, math.pi * 1.98); sx = cx + math.cos(th) * a * R.uniform(.7, 1.12); sy = (cy - 90) + math.sin(th) * (b * .9) * R.uniform(.75, 1.02)
            ln = R.uniform(34, 90) if style != 'long' else R.uniform(120, 380); dx = math.cos(th) * 1.0; dy = -math.sin(th) * .25 + .55
            pts = [(sx, sy)]; x, y = sx, sy
            for i in range(10): x += dx * ln / 10 + math.sin(i * .7 + th * 5) * 1.6 * (1.4 if style == 'long' else .6); y += (dy + (.6 if style == 'long' and i > 3 else 0)) * ln / 10; pts.append((x, y))
            v = int(R.integers(80, 255)); (d if R.random() < .6 else dl).line(pts, fill=v, width=2 if R.random() < .6 else 1)
        sm = np.clip(blur(mask_from(im), .45) * np.clip(hairmask + blur(hairmask, 12) * .6, 0, 1), 0, 1); hc = np.array(hair, np.float32) / 255
        light_side = np.clip(.55 - (np.arange(W)[None, :] - cx) / W * 1.3, .1, 1)
        cv = comp(cv, np.clip(hc * (.55 + .9 * sm[..., None] * light_side[..., None]), 0, 1), np.clip(sm * 1.4, 0, .85))
        spec_h = blur(mask_from(lo), .5) * hairmask; cv = screen(cv, spec_h[..., None] * hc.reshape(1, 1, 3) * .5 * light_side[..., None])
        cv = glow(cv, np.clip(hairmask - blur(hairmask, 3), 0, 1), A, .35, 3)
    # --- accessories ---
    def metal(m, base, spc=1.0, relief=22): return shade(cv, m, base, relief=relief, amb=.28, spec=spc)
    if 'flame' in acc:
        fm = M(lambda d: d.polygon([(cx - a * 1.1, cy - 40), (cx - a * .9, cy - 200), (cx - a * .5, cy - 150), (cx - a * .3, cy - 300), (cx, cy - 190), (cx + a * .35, cy - 310), (cx + a * .55, cy - 160), (cx + a * .95, cy - 210), (cx + a * 1.1, cy - 40), (cx, cy - 110)], fill=255)); yy = np.linspace(0, 1, H)[:, None]
        fcol = ramp(np.clip((np.arange(H)[:, None] * np.ones((1, W)) - (cy - 310)) / 280, 0, 1), [(0, (255, 232, 120)), (.5, (255, 140, 30)), (1, (200, 40, 20))]); cv = comp(cv, fcol, fm * .95); cv = glow(cv, fm, (255, 120, 20), .8, 22)
    if 'helmet' in acc:
        hm2 = np.clip(M(ell(cx, cy - 70, a * 1.12, b * .86)) * (1 - M(poly([(0, cy - 36), (W, cy - 36), (W, H), (0, H)]))), 0, 1)
        cv = metal(hm2, tuple(int(v * .55 + 40) for v in A) if spec.get('helmet_accent') else (96, 102, 114), 1.2, 34)
        band = M(lambda d: d.rounded_rectangle([cx - a * 1.14, cy - 62, cx + a * 1.14, cy - 34], 8, fill=255)); cv = shade(cv, band, (44, 48, 56), relief=8, amb=.35, spec=.8); cv = glow(cv, M(ell(cx, cy - 48, 90, 3)), A, .6, 5)
    if 'lamp' in acc: lm = M(ell(cx, cy - 190, 26, 26)); cv = comp(cv, (1, .97, .82), lm); cv = glow(cv, lm, (255, 240, 180), 1.4, 30)
    if 'hood' in acc:
        outer = M(lambda d: d.polygon([(cx - a * 1.7, 640), (cx - a * 1.45, 300), (cx - a * 1.0, 130), (cx, 84), (cx + a * 1.0, 130), (cx + a * 1.45, 300), (cx + a * 1.7, 640), (cx + a * 1.0, 700), (cx - a * 1.0, 700)], fill=255))
        inner = M(ell(cx, cy + 18, a * .98, b * .98)); front = np.clip(outer - inner, 0, 1); cv = shade(cv, front, tuple(spec.get('hood_c', (60, 44, 98))), relief=34, amb=.3, tex=fbm(H, W, seed + 9, 3, 3) * 0.5)
        cv = cv * (1 - .5 * np.clip(blur(inner, 7) - inner, 0, 1)[..., None] * outer[..., None]); cv = glow(cv, np.clip(front - blur(front, 2.5), 0, 1), A, .5, 4)
    if 'hat' in acc:
        brim = M(ell(cx, cy - 96, a * 1.62, 34)); crown = M(lambda d: d.rounded_rectangle([cx - a * .86, cy - 230, cx + a * .86, cy - 96], 46, fill=255))
        cv = shade(cv, crown, (74, 54, 38), relief=26, amb=.35, tex=fbm(H, W, seed + 10, 2, 2) * 0.3); cv = shade(cv, brim, (60, 44, 32), relief=12, amb=.4); band = M(lambda d: d.rectangle([cx - a * .86, cy - 126, cx + a * .86, cy - 104], fill=255)); cv = comp(cv, np.array(A, np.float32) / 255, band * .85)
    if 'turban' in acc:
        tm = np.clip(M(ell(cx, cy - 90, a * 1.1, b * .9)) * (1 - M(poly([(0, cy - 40), (W, cy - 40), (W, H), (0, H)]))), 0, 1); st = np.sin((np.arange(W)[None, :] * .5 + np.arange(H)[:, None] * 1.2) * .12) * 0.9
        cv = shade(cv, tm, spec.get('turban_c', (214, 186, 132)), relief=36, amb=.35, tex=st)
    if 'headband' in acc: hb = M(lambda d: d.rounded_rectangle([cx - a * 1.05, cy - 88, cx + a * 1.05, cy - 62], 10, fill=255)); cv = shade(cv, hb, tuple(int(v * .8) for v in A), relief=8, amb=.5); cv = glow(cv, hb, A, .5, 8)
    if 'cross' in acc: cr = M(lambda d: (d.rectangle([cx - 14, cy - 190, cx + 14, cy - 130], fill=255), d.rectangle([cx - 30, cy - 172, cx + 30, cy - 148], fill=255))); cv = shade(cv, cr, (230, 40, 50), relief=6, amb=.6, spec=.5)
    if 'leaf' in acc:
        for s in (-1, 1): lf = M(lambda d, s=s: d.polygon([(cx + s * a * .9, cy - 120), (cx + s * a * 1.5, cy - 190), (cx + s * a * 1.55, cy - 120), (cx + s * a * 1.1, cy - 80)], fill=255)); cv = shade(cv, lf, (66, 150, 82), relief=10, amb=.4)
    if 'horns' in acc:
        for s in (-1, 1): hn = M(lambda d, s=s: d.polygon([(cx + s * a * .55, cy - 150), (cx + s * a * .95, cy - 230), (cx + s * a * 1.15, cy - 330), (cx + s * a * 1.3, cy - 250), (cx + s * a * 1.15, cy - 160), (cx + s * a * .9, cy - 120)], fill=255)); cv = shade(cv, hn, (226, 214, 190), relief=18, amb=.35, spec=.5); cv = glow(cv, np.clip(hn - blur(hn, 3), 0, 1), A, .5, 5)
    if 'mask' in acc: mk = M(lambda d: d.polygon([(cx - a * .95, cy + 20), (cx, cy + 2), (cx + a * .95, cy + 20), (cx + a * .8, cy + b * .9), (cx, cy + b * 1.12), (cx - a * .8, cy + b * .9)], fill=255)); mk = mk * (1 - soft(cx, cy - 10, a, 40, 4) * 0); cv = shade(cv, mk, (24, 22, 32), relief=26, amb=.35, tex=fbm(H, W, seed + 11, 2, 2) * 0.4)
    if 'cyberjaw' in acc: cj = M(lambda d: d.polygon([(cx - a * .94, cy + 70), (cx - a * .72, cy + b * .9), (cx, cy + b * 1.02), (cx + a * .72, cy + b * .9), (cx + a * .94, cy + 70), (cx + a * .88, cy + 64), (cx + a * .68, cy + b * .86), (cx, cy + b * .97), (cx - a * .68, cy + b * .86), (cx - a * .88, cy + 64)], fill=255)); cv = metal(cj, (110, 118, 130), 1.3, 12); cv = glow(cv, M(ell(cx + a * .6, cy + b * .62, 7, 7)), A, 1.2, 8)
    if 'scar' in acc: sc = M(lambda d: (d.line([(cx - 88, cy - 44), (cx - 44, cy + 98)], fill=255, width=6), [d.line([(cx - 96 + i * 9, cy - 20 + i * 24), (cx - 70 + i * 9, cy - 14 + i * 24)], fill=255, width=3) for i in range(5)])); cv = comp(cv, (186, 96, 98), sc * .8)
    if 'goggles' in acc:
        strap = M(lambda d: d.rectangle([cx - a * 1.05, ey - 16, cx + a * 1.05, ey + 16], fill=255)); cv = shade(cv, strap, (36, 32, 40), relief=8, amb=.4)
        for s in (-1, 1):
            ring = M(ell(cx + s * ex, ey, 46, 46)) - M(ell(cx + s * ex, ey, 36, 36)); lens = M(ell(cx + s * ex, ey, 36, 36)); cv = shade(cv, np.clip(ring, 0, 1), (120, 112, 98), relief=8, amb=.3, spec=1.2)
            lc = ramp(np.clip((np.arange(H)[:, None] * np.ones((1, W)) - (ey - 36)) / 72, 0, 1), [(0, tuple(int(v * .5) for v in A)), (1, (10, 14, 24))]); cv = comp(cv, lc, lens * .9); cv = glow(cv, lens, A, .45, 10); cv = comp(cv, (1, 1, 1), M(ell(cx + s * ex - 12, ey - 14, 12, 7)) * .5)
    if 'glasses' in acc:
        for s in (-1, 1): fr = M(ell(cx + s * ex, ey, 42, 34)) - M(ell(cx + s * ex, ey, 38, 30)); cv = comp(cv, (26, 24, 30), np.clip(fr, 0, 1)); cv = comp(cv, (1, 1, 1), M(ell(cx + s * ex - 14, ey - 10, 10, 5)) * .35)
        cv = comp(cv, (26, 24, 30), M(lambda d: d.line([(cx - ex + 40, ey - 4), (cx + ex - 40, ey - 4)], fill=255, width=4)))
    if 'visor' in acc:
        vm = M(lambda d: d.rounded_rectangle([cx - a * 1.05, ey - 30, cx + a * 1.05, ey + 24], 26, fill=255)); vc = ramp(np.clip((np.arange(W)[None, :] * np.ones((H, 1)) - (cx - a * 1.05)) / (a * 2.1), 0, 1), [(0, (6, 10, 20)), (.5, tuple(int(v * .35) for v in A)), (1, (6, 10, 20))])
        cv = comp(cv, vc, vm * .96); cv = comp(cv, (1, 1, 1), M(lambda d: d.polygon([(cx - a * .6, ey - 28), (cx - a * .2, ey - 28), (cx - a * .5, ey + 22), (cx - a * .9, ey + 22)], fill=255)) * .22); cv = glow(cv, np.clip(vm - blur(vm, 3), 0, 1), A, 1.0, 6); cv = glow(cv, M(lambda d: d.line([(cx - a * .9, ey - 2), (cx + a * .9, ey - 2)], fill=255, width=4)), A, .8, 8)
    if 'cybereye' in acc: ce = M(ell(cx + ex, ey, 21, 21)); cv = comp(cv, np.array(A, np.float32) / 255 * .8, ce); cv = comp(cv, (4, 6, 12), M(ell(cx + ex, ey, 9, 9))); cv = glow(cv, ce, A, 1.4, 12); cv = comp(cv, (1, 1, 1), M(ell(cx + ex - 6, ey - 6, 4, 4)) * .9)
    if 'faceglow' in acc:
        for s in (-1, 1): fg = M(ell(cx + s * ex, ey, 34, 15)); cv = comp(cv, np.array(A, np.float32) / 255, fg * .9); cv = glow(cv, fg, A, 1.4, 14)
    if 'antenna' in acc:
        rod = M(lambda d: d.line([(cx + a * 1.0, cy - 110), (cx + a * 1.3, cy - 340)], fill=255, width=7)); cv = shade(cv, rod, (130, 136, 148), relief=3, amb=.4, spec=1.0); tip = M(ell(cx + a * 1.3, cy - 342, 13, 13)); cv = comp(cv, np.array(A, np.float32) / 255, tip); cv = glow(cv, tip, A, 1.6, 16)
    if 'jack' in acc:
        cab = M(lambda d: d.line([(cx - a * 1.0, cy - 40), (cx - a * 1.4, cy + 120), (cx - a * 1.2, 640)], fill=255, width=8)); cv = shade(cv, cab, (30, 28, 36), relief=3, amb=.4, spec=.6); cv = glow(cv, M(ell(cx - a * 1.0, cy - 40, 7, 7)), A, 1.2, 8)
    cv = glow(cv, np.clip(hm - blur(hm, 3), 0, 1) * 0, A, 0)
    out = grain(vignette(cv, .45), .010, seed); h2 = ramp(np.clip(out.mean(-1), 0, 1), [(0, (8, 6, 22)), (.5, (128, 120, 140)), (1, (255, 246, 240))]); out = out * .8 + h2 * .2
    img = to_img(np.clip(out, 0, 1)).resize((W // 2, H // 2), Image.LANCZOS); img.save(path, 'JPEG', quality=88, optimize=True); return time.time() - t0

# ----- class and NPC definitions -----
CLASSES = {  # key: (accent, accent2, outfit rgb, accessories, hair colour, theme)
    'magician': ('violet', 'pink', (54, 40, 100), ['hood', 'glow'], 'brown', 'fantasy'), 'thief': ('green', 'violet', (30, 32, 40), ['mask', 'hood'], 'black', 'fantasy'), 'alchemist': ('green', 'gold', (186, 190, 180), ['goggles'], 'auburn', 'fantasy'),
    'gunslinger': ('orange', 'gold', (96, 62, 38), ['hat', 'scar', 'stubble'], 'brown', 'west'), 'barbarian': ('red', 'orange', (70, 36, 34), ['scar', 'cyberjaw', 'pauldron'], 'black', 'scifi'), 'engineer': ('gold', 'cyan', (190, 140, 40), ['helmet', 'lamp'], 'brown', 'scifi'),
    'necromancer': ('violet', 'green', (34, 26, 52), ['hood', 'faceglow'], 'black', 'fantasy'), 'cleric': ('gold', 'cyan', (36, 34, 40), ['hat', 'cross'], 'grey', 'west'), 'druid': ('green', 'gold', (44, 86, 56), ['leaf'], 'auburn', 'fantasy'),
    'bard': ('pink', 'cyan', (140, 40, 52), ['hat', 'stubble'], 'brown', 'west'), 'wirewalker': ('cyan', 'pink', (24, 40, 70), ['visor', 'antenna', 'jack'], 'blue', 'scifi'), 'scavenger': ('orange', 'green', (110, 84, 56), ['hat', 'stubble', 'scar'], 'brown', 'west'),
    'dragon': ('orange', 'red', (110, 34, 24), ['horns', 'flame'], 'red', 'fantasy'), 'android': ('cyan', 'violet', (70, 78, 96), ['visor', 'cyberjaw', 'antenna'], 'grey', 'scifi'), 'shapeshifter': ('green', 'orange', (60, 76, 52), ['leaf', 'scar'], 'brown', 'fantasy'),
    'gambler': ('gold', 'pink', (110, 22, 38), ['hat', 'glasses', 'stubble'], 'black', 'west'), 'ripperdoc': ('cyan', 'green', (200, 206, 214), ['visor', 'cyberjaw'], 'grey', 'scifi'), 'outlaw': ('orange', 'red', (70, 46, 34), ['hat', 'mask', 'scar'], 'brown', 'west'), 'pirate': ('cyan', 'gold', (36, 58, 92), ['hat', 'scar', 'stubble'], 'black', 'fantasy')}
NPCS = {  # id: gender, hair, acc, accent, outfit, skin
    'torv': ('male', 'grey', ['scar', 'cybereye', 'stubble'], 'gold', (60, 46, 40), 2), 'elara': ('female', 'blond', ['cross', 'headband'], 'green', (226, 226, 232), 1), 'brann': ('male', 'brown', ['goggles', 'beard'], 'orange', (84, 56, 40), 3),
    'mara': ('female', 'auburn', ['headband'], 'pink', (120, 40, 60), 2), 'hale': ('male', 'black', ['helmet'], 'cyan', (50, 70, 100), 4), 'pell': ('male', 'grey', ['glasses', 'stubble'], 'green', (86, 100, 70), 1),
    'fenwick': ('male', 'white', ['hood', 'beard'], 'green', (56, 80, 50), 2), 'aldous': ('male', 'grey', ['hood', 'glasses'], 'violet', (70, 64, 90), 0), 'barnaby': ('male', 'grey', ['hat', 'beard'], 'cyan', (70, 86, 100), 3),
    'greta': ('female', 'brown', ['scar'], 'orange', (110, 60, 40), 1), 'durn': ('male', 'red', ['helmet', 'lamp', 'beard'], 'gold', (96, 70, 44), 2), 'rashid': ('male', 'black', ['turban', 'beard'], 'gold', (150, 110, 60), 4),
    'ulf': ('male', 'white', ['hood', 'beard', 'visor'], 'cyan', (96, 100, 112), 1), 'sael': ('female', 'red', ['goggles', 'flame'], 'orange', (120, 40, 30), 2), 'voss': ('female', 'brown', ['helmet', 'scar'], 'cyan', (70, 80, 92), 3), 'quill': ('female', 'brown', ['hat', 'glasses'], 'green', (120, 100, 60), 1), 'aldric': ('male', 'black', ['stubble', 'scar'], 'gold', (36, 30, 34), 1),
    'dale': ('male', 'brown', ['stubble'], 'orange', (70, 90, 120), 2), 'wanda': ('female', 'auburn', ['glasses'], 'pink', (150, 70, 110), 1), 'gary': ('male', 'black', ['stubble'], 'cyan', (36, 52, 96), 3),
    'slick': ('male', 'black', ['hat', 'scar', 'stubble'], 'orange', (70, 30, 36), 2), 'whitlock': ('male', 'grey', ['hat', 'stubble', 'scar'], 'gold', (70, 56, 44), 1), 'sylwen': ('female', 'white', ['leaf', 'glow'], 'green', (60, 96, 64), 0), 'okoro': ('female', 'black', ['visor', 'cyberjaw'], 'cyan', (60, 70, 90), 4), 'marrow': ('female', 'grey', ['hat', 'glow'], 'cyan', (40, 60, 80), 0), 'cobb': ('male', 'grey', ['hat', 'glasses', 'beard'], 'orange', (40, 38, 44), 2),
    'watcher': ('nonbinary', 'white', ['glow', 'faceglow'], 'violet', (40, 34, 80), 0)}

def run(pub, only=None):
    os.makedirs(os.path.join(pub, 'img/player'), exist_ok=True); os.makedirs(os.path.join(pub, 'img/npc'), exist_ok=True); n = 0
    for k, (a1, a2, outfit, acc, hc, theme) in CLASSES.items():
        for gi, g in enumerate(('male', 'female', 'nonbinary')):
            if only and f'{k}-{g[0]}' not in only: continue
            seed = abs(hash(k)) % 9973 + gi * 7; seed = sum(ord(c) for c in k) * 13 + gi * 101
            spec = dict(gender=g, accent=a1, accent2=a2, outfit=outfit, acc=list(acc), hair=hc if g != 'female' or hc != 'black' else 'black', skin=(seed % 6), hood_c=tuple(int(v * 1.1) for v in outfit), helmet_accent=False, theme=theme)
            if g == 'female' and hc == 'brown': spec['hair'] = 'auburn'
            t = render(spec, seed, os.path.join(pub, 'img/player', f'{k}-{g[0]}.jpg')); n += 1; print('player', k, g[0], round(t, 1), 's', flush=True)
    for k, (g, hc, acc, a1, outfit, sk) in NPCS.items():
        if only and k not in only: continue
        spec = dict(gender=g, hair=hc, acc=list(acc), accent=a1, accent2='pink', outfit=outfit, skin=sk, hood_c=tuple(int(v * 1.1) for v in outfit), turban_c=(210, 180, 130), theme={'torv': 'west', 'elara': 'west', 'brann': 'west', 'mara': 'west', 'hale': 'west', 'pell': 'fantasy', 'fenwick': 'fantasy', 'aldous': 'fantasy', 'barnaby': 'fantasy', 'greta': 'west', 'durn': 'west', 'rashid': 'fantasy', 'ulf': 'scifi', 'sael': 'scifi', 'voss': 'fantasy', 'watcher': 'scifi', 'quill': 'fantasy', 'aldric': 'fantasy', 'dale': 'modern', 'wanda': 'modern', 'gary': 'modern', 'slick': 'west', 'whitlock': 'west', 'sylwen': 'fantasy', 'okoro': 'scifi', 'marrow': 'fantasy', 'cobb': 'west'}.get(k, 'fantasy'))
        t = render(spec, sum(ord(c) for c in k) * 17, os.path.join(pub, 'img/npc', f'{k}.jpg')); n += 1; print('npc', k, round(t, 1), 's', flush=True)
    return n
