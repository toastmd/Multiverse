"""Material, tool and item icons (256x256): lit objects over a dark bokeh backdrop, with soft shadows and specular highlights."""
import math, os, time
import numpy as np
from PIL import Image, ImageDraw
from .common import *

S = 512
def mk(fn, bl=1.0):
    im = Image.new('L', (S, S), 0); fn(ImageDraw.Draw(im)); return blur(mask_from(im), bl)
def backdrop(seed, tint):
    r = np.random.default_rng(seed); y, x = np.mgrid[0:S, 0:S].astype(np.float32); d = np.sqrt((x - S / 2) ** 2 + (y - S * .55) ** 2) / S
    cv = np.zeros((S, S, 3), np.float32) + np.array([10, 7, 20], np.float32) / 255 + (np.array(tint, np.float32) / 255) * np.exp(-d * 3.2)[..., None] * .28
    bk = Image.new('RGB', (S, S), (0, 0, 0)); dr = ImageDraw.Draw(bk)
    for _ in range(14):
        cx, cy, rad = r.random() * S, r.random() * S, r.uniform(14, 48); c = tuple(int(v * r.uniform(.12, .3)) for v in tint); dr.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=c)
    return screen(cv, blur(from_img(bk), 7))
def paint(cv, m, base, relief=14, amb=.34, spec=1.0, tex=None, light=(-.5, -.6, .62)):
    h = blur(m, relief) * relief * 1.2
    if tex is not None: h = h + tex
    s = lit(h, light, 1.5); b = np.array(base, np.float32).reshape(1, 1, 3) / 255 if not isinstance(base, np.ndarray) else base
    col = b * (amb + (1 - amb) * s)[..., None] + spec * np.clip(s - .74, 0, 1)[..., None] * 2.2
    return comp(cv, np.clip(col, 0, 1), m)
def shadow(cv, m, k=.55): sm = blur(np.roll(np.roll(m, 14, 0), 10, 1), 9); return cv * (1 - k * sm[..., None])
def glowc(cv, m, col, k=1.0, s=16): return screen(cv, blur(m, s)[..., None] * np.array(col, np.float32).reshape(1, 1, 3) / 255 * k)
def rot(pts, cx, cy, a): ca, sa = math.cos(a), math.sin(a); return [(cx + (x - cx) * ca - (y - cy) * sa, cy + (x - cx) * sa + (y - cy) * ca) for x, y in pts]
def blob(cx, cy, r, seed, n=18, jit=.22):
    rr = np.random.default_rng(seed); return [(cx + math.cos(t) * r * (1 + rr.uniform(-jit, jit)), cy + math.sin(t) * r * (1 + rr.uniform(-jit, jit))) for t in np.linspace(0, 2 * math.pi, n, endpoint=False)]

def ore(cv, seed, base, flecks, glowc_=None, facets=False):
    m = mk(lambda d: d.polygon(blob(S / 2, S * .54, 170, seed), fill=255), 2.5); cv = shadow(cv, m)
    t = fbm(S, S, seed, 7, 4) * (6 if not facets else 2.5); cv = paint(cv, m, base, 40, .3, .7 if not facets else 1.5, t)
    if facets:
        r = np.random.default_rng(seed); pts = r.random((14, 2)) * S; idx = np.argmin(((np.mgrid[0:S, 0:S].transpose(1, 2, 0)[:, :, None, :] - pts[None, None, :, ::-1]) ** 2).sum(-1), axis=-1) if False else None
    for _ in range(flecks[1]):
        rr = np.random.default_rng(seed + _); x, y = S / 2 + rr.normal(0, 70), S * .54 + rr.normal(0, 60); fm = mk(lambda d: d.ellipse([x - 6, y - 5, x + 6, y + 5], fill=255), .8); cv = paint(cv, fm * m, flecks[0], 4, .5, 1.6)
    if glowc_: cv = glowc(cv, m * 0.6, glowc_, .7, 24)
    return cv
def facet_metal(cv, seed, hue, glowc_=None):
    r = np.random.default_rng(seed); m = mk(lambda d: d.polygon(blob(S / 2, S * .54, 176, seed, 9, .18), fill=255), 1.2); cv = shadow(cv, m)
    pts = r.random((16, 2)) * np.array([S, S]); yy, xx = np.mgrid[0:S, 0:S].astype(np.float32); best = np.full((S, S), 1e9, np.float32); idx = np.zeros((S, S), np.int32)
    for i, (px, py) in enumerate(pts): d2 = (xx - px) ** 2 + (yy - py) ** 2; mm = d2 < best; idx = np.where(mm, i, idx); best = np.minimum(best, d2)
    fl = r.random(16).astype(np.float32)[idx]; ang = (xx / S * .8 + yy / S * .5) + fl * 1.4; env = .5 + .5 * np.sin(ang * 5.0); v = np.clip(.25 + .55 * fl + .35 * env, 0, 1)
    col = ramp(v, [(0, tuple(int(c * .35) for c in hue)), (.55, hue), (1, (250, 252, 255))]); edge = np.clip(blur(m, 2.5) - blur(m, 9), 0, 1); col = comp(col, (255, 255, 255), edge * .35)
    cv = comp(cv, col, m)
    if glowc_: cv = glowc(cv, m, glowc_, .9, 26)
    return cv
def leaf(cv, cx, cy, ang, ln, wd, base, seed):
    pts = []
    for t in np.linspace(0, 1, 20): pts.append((cx + ln * t, cy - wd * math.sin(math.pi * t) ** .8))
    for t in np.linspace(1, 0, 20): pts.append((cx + ln * t, cy + wd * math.sin(math.pi * t) ** .8))
    pts = rot(pts, cx, cy, ang); m = mk(lambda d: d.polygon(pts, fill=255), 1.2); cv = shadow(cv, m, .4); ve = mk(lambda d: [d.line(rot([(cx, cy), (cx + ln, cy)], cx, cy, ang), fill=255, width=4)] + [d.line(rot([(cx + ln * t, cy), (cx + ln * t + ln * .2, cy + s * wd * .8)], cx, cy, ang), fill=255, width=2) for t in (.25, .45, .65) for s in (-1, 1)], .8)
    cv = paint(cv, m, base, 12, .35, .8, fbm(S, S, seed, 3, 2) * .2); return comp(cv, np.array(base, np.float32) / 255 * .45, ve * m * .75)
def herb(cv, seed):
    st = mk(lambda d: d.line([(S / 2, S * .9), (S / 2 + 10, S * .5)], fill=255, width=12), 1.2); cv = paint(cv, st, (60, 120, 50), 4, .4, .5)
    for ang, ln, wd, col in [(-1.5, 200, 54, (66, 146, 54)), (-2.2, 190, 50, (52, 124, 44)), (-.85, 190, 50, (80, 160, 60)), (-1.9, 120, 36, (96, 170, 70))]: cv = leaf(cv, S / 2 + 6, S * .56, ang, ln, wd, col, seed + int(ang * 10))
    return cv
def bloom(cv, seed):
    st = mk(lambda d: d.line([(S / 2, S * .92), (S / 2, S * .55)], fill=255, width=12), 1.2); cv = paint(cv, st, (60, 130, 90), 4, .4, .5); cv = leaf(cv, S / 2, S * .8, -.6, 110, 26, (70, 150, 96), seed)
    for i in range(7):
        a = i / 7 * 2 * math.pi; pts = rot([(S / 2 + t * 130, S * .42 - 52 * math.sin(math.pi * t)) for t in np.linspace(0, 1, 14)] + [(S / 2 + t * 130, S * .42 + 52 * math.sin(math.pi * t)) for t in np.linspace(1, 0, 14)], S / 2, S * .42, a); m = mk(lambda d, p=pts: d.polygon(p, fill=255), 1.4); cv = shadow(cv, m, .25); cv = paint(cv, m, (190, 225, 255), 12, .5, .8, fbm(S, S, seed + i, 3, 2) * .2)
    c = mk(lambda d: d.ellipse([S / 2 - 34, S * .42 - 34, S / 2 + 34, S * .42 + 34], fill=255), 1.5); cv = paint(cv, c, (255, 232, 120), 10, .5, 1.2); return glowc(cv, c, (200, 230, 255), 1.1, 40)
def pearl(cv, seed):
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32); cx, cy, R = S / 2, S * .55, 150; dx, dy = (xx - cx) / R, (yy - cy) / R; r2 = dx * dx + dy * dy; m = np.clip((1 - r2) * 40, 0, 1); cv = shadow(cv, m, .6)
    nz = np.sqrt(np.clip(1 - r2, 0, 1)); L = np.array([-.5, -.6, .62]); L = L / np.linalg.norm(L); dif = np.clip(dx * L[0] + dy * L[1] + nz * L[2], 0, 1); sp = np.clip(dx * L[0] * 0 + (dx * -.35 + dy * -.45 + nz * .8), 0, 1) ** 40
    irid = np.stack([.5 + .5 * np.sin(nz * 6 + 0), .5 + .5 * np.sin(nz * 6 + 2.1), .5 + .5 * np.sin(nz * 6 + 4.2)], -1) * .22; col = (np.array([238, 234, 244], np.float32) / 255) * (.35 + .75 * dif[..., None]) + irid * (1 - nz[..., None]) + sp[..., None] * .9
    env = np.clip((yy - cy) / R, 0, 1) * (1 - nz) * .3; col = col + env[..., None] * np.array([.5, .3, .8], np.float32); cv = comp(cv, np.clip(col, 0, 1), m); return cv
def fish(cv, seed):
    cx, cy = S / 2, S * .54; body = mk(lambda d: d.ellipse([cx - 180, cy - 70, cx + 150, cy + 74], fill=255), 1.5); tail = mk(lambda d: d.polygon([(cx + 120, cy), (cx + 210, cy - 80), (cx + 190, cy), (cx + 210, cy + 80)], fill=255), 1.5); fin = mk(lambda d: d.polygon([(cx - 30, cy - 66), (cx + 40, cy - 110), (cx + 70, cy - 60)], fill=255), 1.5)
    allm = np.clip(body + tail + fin, 0, 1); cv = shadow(cv, allm); yy, xx = np.mgrid[0:S, 0:S].astype(np.float32); v = np.clip((yy - (cy - 70)) / 144, 0, 1); col = ramp(v, [(0, (40, 80, 130)), (.5, (150, 190, 210)), (1, (236, 240, 246))])
    sc = (np.sin(xx / 9.0 + (np.floor(yy / 12) % 2) * 3.14) * np.sin(yy / 6.5)) * .5; h = blur(body, 18) * 18 + sc * 1.2; ln = lit(h, (-.5, -.6, .6), 1.3); cv = comp(cv, col * (.35 + .85 * ln[..., None]), body); cv = paint(cv, tail, (90, 140, 180), 10, .4, .6); cv = paint(cv, fin, (70, 120, 170), 10, .4, .6)
    eye = mk(lambda d: d.ellipse([cx - 150, cy - 20, cx - 118, cy + 12], fill=255), 1); cv = comp(cv, (14, 12, 18), eye); return comp(cv, (1, 1, 1), mk(lambda d: d.ellipse([cx - 142, cy - 14, cx - 132, cy - 4], fill=255), .8) * .9)
def scale(cv, seed):
    m = mk(lambda d: d.polygon([(S / 2, 70), (S / 2 + 150, 130), (S / 2 + 160, 290), (S / 2, 450), (S / 2 - 160, 290), (S / 2 - 150, 130)], fill=255), 2); cv = shadow(cv, m); yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    rid = np.cos((np.abs(xx - S / 2) * .6 + (yy - 70) * .35) / 10.0) * 1.4 + fbm(S, S, seed, 6, 3) * .5; col = ramp(np.clip((yy - 70) / 380, 0, 1), [(0, (255, 170, 70)), (.5, (210, 70, 30)), (1, (110, 24, 18))]); h = blur(m, 30) * 30 + rid; ln = lit(h, (-.5, -.6, .6), 1.5)
    cv = comp(cv, np.clip(col * (.3 + .9 * ln[..., None]) + np.clip(ln - .8, 0, 1)[..., None] * .5, 0, 1), m); return glowc(cv, m * .5, (255, 110, 40), .6, 30)
def tool(cv, kind, seed):
    wood = (120, 86, 52); steel = (176, 184, 196)
    if kind == 'fishingpole':
        rod = mk(lambda d: d.line([(60, 450), (400, 70)], fill=255, width=14), 1.2); cv = shadow(cv, rod); cv = paint(cv, rod, wood, 5, .35, 1.0, fbm(S, S, seed, 3, 2) * .2)
        reel = mk(lambda d: d.ellipse([170, 270, 250, 350], fill=255), 1); cv = paint(cv, reel, steel, 14, .3, 1.4); ln = mk(lambda d: d.line([(400, 70), (440, 230), (420, 400)], fill=255, width=3), .8); cv = comp(cv, (225, 232, 240), ln * .8)
        hk = mk(lambda d: d.arc([405, 392, 437, 430], 0, 180, fill=255, width=6), .8); cv = paint(cv, hk, steel, 3, .4, 1.4); lure = mk(lambda d: d.ellipse([398, 336, 440, 380], fill=255), 1); cv = paint(cv, lure, (255, 79, 216), 8, .4, 1.5); return glowc(cv, lure, (255, 79, 216), .8, 14)
    if kind == 'miningpick':
        h = mk(lambda d: d.line([(110, 450), (390, 150)], fill=255, width=22), 1.2); cv = shadow(cv, h); cv = paint(cv, h, wood, 6, .35, .8, fbm(S, S, seed, 3, 2) * .2)
        head = mk(lambda d: d.polygon(rot([(240, 160), (420, 120), (470, 160), (430, 170), (300, 190), (240, 210)], 340, 170, -.15) + [], fill=255), 1.2); cv = paint(cv, head, steel, 16, .28, 1.6); return cv
    if kind == 'sickle':
        h = mk(lambda d: d.line([(130, 440), (280, 250)], fill=255, width=20), 1.2); cv = shadow(cv, h); cv = paint(cv, h, wood, 5, .35, .8)
        bl = mk(lambda d: d.polygon([(280, 250), (330, 150), (410, 100), (460, 120), (410, 140), (360, 200), (320, 280)], fill=255), 1.4); cv = paint(cv, bl, (210, 218, 226), 10, .28, 1.8); return cv
    if kind == 'hammer':
        h = mk(lambda d: d.line([(120, 450), (320, 200)], fill=255, width=24), 1.2); cv = shadow(cv, h); cv = paint(cv, h, wood, 6, .35, .8)
        hd = mk(lambda d: d.polygon(rot([(250, 150), (440, 150), (440, 230), (250, 230)], 345, 190, -.55), fill=255), 1.4); cv = paint(cv, hd, (120, 130, 146), 18, .26, 1.7); return cv
    if kind == 'alembic':
        fl = mk(lambda d: (d.ellipse([140, 220, 340, 420], fill=255), d.rectangle([215, 120, 265, 250], fill=255)), 1.5); cv = shadow(cv, fl, .45)
        liq = mk(lambda d: d.ellipse([154, 290, 326, 412], fill=255), 1.5) * fl; cv = comp(cv, (40, 60, 90), fl * .5); cv = paint(cv, liq, (255, 79, 216), 20, .5, 1.2); cv = glowc(cv, liq, (255, 79, 216), .9, 28)
        rim = np.clip(blur(fl, 2) - blur(fl, 7), 0, 1); cv = comp(cv, (190, 230, 255), rim * .7); cv = comp(cv, (1, 1, 1), mk(lambda d: d.ellipse([170, 250, 200, 340], fill=255), 5) * .35)
        tube = mk(lambda d: d.line([(240, 130), (360, 100), (420, 190), (410, 300)], fill=255, width=14), 1.5); return paint(cv, tube, (120, 200, 230), 5, .4, 1.4)
    if kind == 'skillet':
        pan = mk(lambda d: d.ellipse([100, 220, 360, 380], fill=255), 1.5); cv = shadow(cv, pan); cv = paint(cv, pan, (44, 44, 52), 24, .3, 1.2); inner = mk(lambda d: d.ellipse([120, 238, 340, 350], fill=255), 2); cv = paint(cv, inner, (26, 26, 32), 16, .4, .8)
        hd = mk(lambda d: d.rounded_rectangle([340, 280, 470, 308], 12, fill=255), 1.2); cv = paint(cv, hd, (60, 56, 52), 8, .3, 1.0); egg = mk(lambda d: d.ellipse([190, 270, 270, 320], fill=255), 2); cv = paint(cv, egg, (250, 248, 240), 10, .5, 1.0); yo = mk(lambda d: d.ellipse([214, 280, 244, 306], fill=255), 1.5); return paint(cv, yo, (255, 190, 40), 6, .5, 1.4)
    if kind == 'crowbar':
        b = mk(lambda d: d.line([(150, 440), (170, 200), (230, 110), (330, 80)], fill=255, width=26), 2); cv = shadow(cv, b); cv = paint(cv, b, (196, 60, 52), 10, .3, 1.5); claw = mk(lambda d: d.polygon([(330, 80), (400, 70), (350, 112), (322, 106)], fill=255), 1.2); return paint(cv, claw, (150, 40, 40), 5, .3, 1.4)
def bag(cv, seed):
    m = mk(lambda d: d.polygon([(190, 180), (330, 180), (420, 300), (410, 430), (100, 430), (92, 300)], fill=255), 8); cv = shadow(cv, m); lea = fbm(S, S, seed, 4, 3) * .5; cv = paint(cv, m, (92, 50, 120), 36, .3, .9, lea)
    st = mk(lambda d: [d.line([(200, 190), (112, 300)], fill=255, width=2), d.line([(320, 190), (400, 300)], fill=255, width=2), d.line([(110, 420), (400, 420)], fill=255, width=2)], .8); cv = comp(cv, (220, 170, 255), st * .5)
    top = mk(lambda d: d.chord([180, 120, 340, 240], 180, 360, fill=255), 4); cv = paint(cv, top, (255, 211, 74), 14, .35, 1.4); cl = mk(lambda d: d.ellipse([230, 300, 290, 360], fill=255), 1.5); cv = paint(cv, cl, (25, 227, 255), 10, .5, 1.6); return glowc(cv, cl, (25, 227, 255), 1.4, 26)
def chrome(cv, seed):
    seg = [mk(lambda d: d.rounded_rectangle([60, 230, 220, 320], 40, fill=255), 2), mk(lambda d: d.rounded_rectangle([200, 214, 380, 330], 44, fill=255), 2), mk(lambda d: d.polygon([(370, 240), (460, 200), (460, 340), (370, 304)], fill=255), 2)]
    for i, m in enumerate(seg): cv = shadow(cv, m, .45); cv = paint(cv, m, [(120, 128, 142), (98, 106, 120), (140, 60, 120)][i], 16, .26, 1.8)
    led = mk(lambda d: [d.ellipse([x - 12, 268 - 12, x + 12, 268 + 12], fill=255) for x in (130, 260, 320)], 1.2); cv = comp(cv, (25, 227, 255), led); return glowc(cv, led, (25, 227, 255), 1.5, 18)
def dice(cv, seed):
    m = mk(lambda d: d.rounded_rectangle([120, 130, 400, 410], 60, fill=255), 3); cv = shadow(cv, m); cv = paint(cv, m, (140, 24, 60), 30, .3, 1.6)
    pm = mk(lambda d: [d.ellipse([x - 20, y - 20, x + 20, y + 20], fill=255) for x, y in [(190, 200), (330, 200), (260, 270), (190, 340), (330, 340)]], 1.4); cv = paint(cv, pm, (250, 240, 236), 6, .5, 1.5); return cv

ICONS = {'herb': (herb, (80, 200, 110)), 'bloom': (bloom, (120, 180, 255)), 'ore': (lambda cv, s: ore(cv, s, (104, 88, 84), ((196, 96, 50), 40)), (180, 120, 80)), 'silver': (lambda cv, s: facet_metal(cv, s, (200, 210, 222)), (180, 200, 230)),
         'mithril': (lambda cv, s: facet_metal(cv, s, (120, 200, 255), (60, 160, 255)), (60, 170, 255)), 'fish': (fish, (80, 150, 220)), 'pearl': (pearl, (200, 150, 255)), 'scale': (scale, (255, 110, 50)),
         'fishingpole': (lambda cv, s: tool(cv, 'fishingpole', s), (80, 180, 255)), 'miningpick': (lambda cv, s: tool(cv, 'miningpick', s), (255, 170, 90)), 'sickle': (lambda cv, s: tool(cv, 'sickle', s), (120, 220, 130)),
         'hammer': (lambda cv, s: tool(cv, 'hammer', s), (255, 130, 60)), 'alembic': (lambda cv, s: tool(cv, 'alembic', s), (255, 79, 216)), 'skillet': (lambda cv, s: tool(cv, 'skillet', s), (255, 190, 90)), 'crowbar': (lambda cv, s: tool(cv, 'crowbar', s), (255, 90, 80)),
         'bag': (bag, (160, 90, 255)), 'chrome': (chrome, (25, 227, 255)), 'dice': (dice, (255, 60, 120))}
def run(pub):
    gi = os.path.join(pub, 'guide/img'); os.makedirs(gi, exist_ok=True); t0 = time.time()
    for i, (name, (fn, tint)) in enumerate(ICONS.items()):
        cv = backdrop(i + 3, tint); cv = fn(cv, 7 + i * 13); cv = grain(vignette(cv, .3), .01, i)
        im = to_img(np.clip(cv, 0, 1)).resize((256, 256), Image.LANCZOS); im.save(os.path.join(gi, f'icon-{name}.jpg'), 'JPEG', quality=90, optimize=True); print('icon', name, round(time.time() - t0, 1), flush=True)
