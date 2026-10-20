"""Area landscapes (960x384) and page banners (1600x400): lit, fogged, bloomed procedural scenes rendered at 2x and downsampled."""
import math, os, time, random
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter1d
from .common import *

class C:
    def __init__(s, w, h, seed=1):
        s.W, s.H, s.w, s.h = w, h, w * 2, h * 2; s.cv = np.zeros((s.h, s.w, 3), np.float32); s.R = random.Random(seed); s.N = np.random.default_rng(seed); s.seed = seed
    def grad(s, top, bot, y0=0.0, y1=1.0, mix=1.0):
        y = np.clip((np.arange(s.h)[:, None] / s.h - y0) / max(y1 - y0, 1e-6), 0, 1)[..., None]; t = np.array(top, np.float32) / 255; b = np.array(bot, np.float32) / 255
        g = (t * (1 - y) + b * y) * np.ones((1, s.w, 1), np.float32); s.cv = s.cv * (1 - mix) + g * mix
    def im(s): im = Image.new('L', (s.w, s.h), 0); return im, ImageDraw.Draw(im)
    def paint(s, im, color, k=1.0, bl=0.0, gl=0.0, gk=1.0):
        m = mask_from(im); m = blur(m, bl) if bl else m
        col = color if isinstance(color, np.ndarray) else np.array(color, np.float32).reshape(1, 1, 3) / 255
        s.cv = comp(s.cv, col, np.clip(m * k, 0, 1))
        if gl: s.cv = screen(s.cv, blur(m, gl)[..., None] * (col if isinstance(col, np.ndarray) else col) * gk)
    def fog(s, color, y0, y1, k=1.0):
        y = np.clip((np.arange(s.h)[:, None] / s.h - y0) / (y1 - y0), 0, 1); y = (1 - np.abs(y * 2 - 1)) if y1 > y0 else y; s.cv = comp(s.cv, np.array(color, np.float32) / 255, (y * k) * np.ones((1, s.w), np.float32))
    def noise_tint(s, k=.06, base=60): n = fbm(s.h, s.w, s.seed + 7, base, 4); s.cv = np.clip(s.cv * (1 + k * n[..., None]), 0, 1)
    def out(s, grain_amt=.012, vig=.3):
        a = vignette(s.cv, vig); a = grain(a, grain_amt, s.seed); return np.asarray(to_img(a).resize((s.W, s.H), Image.LANCZOS), np.float32) / 255

def prof(w, base, amp, seed, smooth=60):
    r = np.random.default_rng(seed); p = np.zeros(w)
    for o, k in enumerate((1.0, .5, .25, .12)): p += gaussian_filter1d(r.random(w) - .5, smooth / (2 ** o), mode='nearest') * amp * k * (3.5 + o)
    return base + p
def ridge(c, p, color, k=1.0, fogc=None, fk=0.0, tex=True, light=None):
    im, d = c.im(); d.polygon([(0, c.h)] + [(x, float(y)) for x, y in enumerate(p)] + [(c.w, c.h)], fill=255)
    m = mask_from(im); col = np.array(color, np.float32).reshape(1, 1, 3) / 255
    if tex: col = col * (1 + .25 * fbm(c.h, c.w, c.seed + int(p[0]), 10, 4)[..., None])
    if light is not None:
        h = blur(m, 9) * 9; ln = lit(h + fbm(c.h, c.w, c.seed + 3, 3, 3) * .6, light, 1.2); col = col * (.55 + .8 * ln[..., None])
    c.cv = comp(c.cv, col, m * k)
    if fogc is not None:
        yy = np.clip((np.arange(c.h)[:, None] - p[None, :].min()) / 160.0, 0, 1) * 0 + 0; c.cv = comp(c.cv, np.array(fogc, np.float32) / 255, m * fk * (1 - np.clip((np.arange(c.h)[:, None] - p[None, :]) / 220, 0, 1)))
def bloom(c, thr=.7, s=14, k=.6): br = np.clip(c.cv - thr, 0, 1); c.cv = screen(c.cv, blur(br, s) * k * 3)
def stars(c, n, y1=.6, k=1.0):
    im, d = c.im()
    for _ in range(n): x, y = c.R.random() * c.w, c.R.random() * c.h * y1; r = c.R.choice([1, 1, 1.5, 2]); d.ellipse([x - r, y - r, x + r, y + r], fill=int(c.R.uniform(120, 255)))
    c.paint(im, (255, 255, 255), k, .6, 4, .6)
def clouds(c, color, y0, y1, k=.5, base=140, seed=0):
    n = np.clip(fbm(c.h, c.w, c.seed + seed + 1, base, 5) * .55 + .35, 0, 1) ** 1.6; y = np.clip(1 - np.abs((np.arange(c.h)[:, None] / c.h - (y0 + y1) / 2) / ((y1 - y0) / 2)), 0, 1)
    c.cv = comp(c.cv, np.array(color, np.float32) / 255, np.clip(n * y * k * 2, 0, 1))
def windows(c, x, y0, bw, bh, pal, dens=1.0):
    im, d = c.im(); out = []
    for wy in range(int(y0 + 14), int(y0 + bh - 10), 16):
        for wx in range(int(x + 8), int(x + bw - 10), 14):
            if c.R.random() < .42 * dens: col = c.R.choice(pal); d.rectangle([wx, wy, wx + 7, wy + 9], fill=255); out.append((wx, wy, col))
    return out
def skyline(c, base, pal, layers=3, hmax=.55, seed=0, neon=True):
    for L in range(layers):
        col = [(22, 12, 40), (14, 8, 30), (8, 5, 20)][min(L, 2)]; x = -20; im, d = c.im(); wins = []
        while x < c.w:
            bw = c.R.randint(70, 190) * (1 + (layers - L) * .15); bh = c.R.randint(int(c.h * .12), int(c.h * hmax * (1 - L * .12))); y0 = base - bh; d.rectangle([x, y0, x + bw, base + 400], fill=255)
            if L > 0 and c.R.random() < .3: d.rectangle([x + bw * .4, y0 - 60, x + bw * .45, y0], fill=255)
            wins += [(x, y0, bw, bh)]; x += bw + c.R.randint(0, 10)
        c.paint(im, col, 1.0); c.fog((70, 34, 100), (base - c.h * hmax) / c.h, base / c.h + .05, .35 * (1 - L * .25))
        if L >= layers - 2:
            wi, wd = c.im(); cols = []
            for (x0, y0, bw, bh) in wins:
                for wy in range(int(y0 + 14), int(y0 + bh - 10), 18):
                    for wx in range(int(x0 + 8), int(x0 + bw - 10), 15):
                        if c.R.random() < .4: wd.rectangle([wx, wy, wx + 7, wy + 10], fill=255)
            c.paint(wi, c.R.choice(pal) if False else pal[0], .0)
            for pc in pal: sub, sd = c.im(); [sd.rectangle([wx, wy, wx + 7, wy + 10], fill=255) for (x0, y0, bw, bh) in wins for wy in range(int(y0 + 14), int(y0 + bh - 10), 18) for wx in range(int(x0 + 8), int(x0 + bw - 10), 15) if c.R.random() < .13]; c.paint(sub, pc, .9, 0.6, 5, .7)
        if neon and L == layers - 1:
            sub, sd = c.im()
            for _ in range(10): x0 = c.R.randint(0, c.w - 100); y0 = c.R.randint(int(base - c.h * .4), int(base - 40)); sd.rectangle([x0, y0, x0 + c.R.randint(30, 110), y0 + 12], fill=255)
            c.paint(sub, pal[c.R.randint(0, len(pal) - 1)], .95, .6, 10, 1.0)
def rain(c, n=500, k=.25):
    im, d = c.im()
    for _ in range(n): x, y = c.R.random() * c.w, c.R.random() * c.h; d.line([(x, y), (x - 6, y + 28)], fill=int(c.R.uniform(60, 200)), width=1)
    c.paint(im, (150, 190, 230), k, .5)
def conifers(c, base, n, hmin, hmax, col, fogc, fk, seed):
    im, d = c.im()
    for _ in range(n):
        x = c.R.random() * c.w; hh = c.R.uniform(hmin, hmax); w = hh * .28; y = base
        for t in range(6): ww = w * (1 - t / 6.5); d.polygon([(x - ww, y - hh * t / 6 * .85), (x + ww, y - hh * t / 6 * .85), (x, y - hh * (t + 1.6) / 6 * .9)], fill=255)
        d.rectangle([x - 3, y - 8, x + 3, y + 30], fill=255)
    m = mask_from(im); ct = np.array(col, np.float32).reshape(1, 1, 3) / 255 * (1 + .3 * fbm(c.h, c.w, seed, 6, 3)[..., None]); c.cv = comp(c.cv, ct, m)
    c.cv = comp(c.cv, np.array(fogc, np.float32) / 255, m * fk * np.clip(1 - (np.arange(c.h)[:, None] - base + hmax) / (hmax * 1.4), 0, 1))
def lightshafts(c, color, n=5, k=.12):
    im, d = c.im()
    for _ in range(n): x = c.R.random() * c.w * 1.0; wdt = c.R.uniform(40, 120); d.polygon([(x, 0), (x + wdt, 0), (x + wdt * 2.4 - 160, c.h), (x - wdt * .8 - 160, c.h)], fill=255)
    c.paint(im, color, k, 18, 22, .15)

# ---------------- area landscapes ----------------
def town(c):
    c.grad((12, 6, 30), (88, 30, 110), 0, .7); stars(c, 60, .35, .6); skyline(c, int(c.h * .78), [(255, 79, 216), (25, 227, 255), (255, 200, 90)], 3, .62)
    c.grad((10, 8, 22), (30, 14, 50), .78, 1.0, 1.0 if False else .0); im, d = c.im(); d.rectangle([0, c.h * .78, c.w, c.h], fill=255); c.paint(im, (16, 10, 30), 1.0)
    refl = c.cv[int(c.h * .78) - 1::-1][:int(c.h * .22)]; ref = blur(refl, 5) * .45; c.cv[int(c.h * .78):int(c.h * .78) + ref.shape[0]] = c.cv[int(c.h * .78):int(c.h * .78) + ref.shape[0]] * .55 + ref[:c.h - int(c.h * .78)] * .6 if ref.shape[0] <= c.h - int(c.h * .78) else c.cv[int(c.h * .78):]
    rain(c, 700, .3); bloom(c, .55, 16, .5)
def forest(c):
    c.grad((34, 70, 84), (170, 150, 110), 0, .6); clouds(c, (230, 200, 170), .05, .35, .35, 160); ridge(c, prof(c.w, c.h * .5, 60, 3), (46, 80, 90), 1, (150, 150, 130), .5, light=(-.4, -.5, .7))
    for i, (b, n, hh, col, fk) in enumerate([(.62, 26, (90, 150), (22, 54, 50), .55), (.74, 30, (130, 220), (14, 42, 32), .35), (.92, 22, (220, 380), (8, 26, 18), .1)]): conifers(c, int(c.h * b), n, hh[0], hh[1], col, (140, 160, 130), fk, 20 + i)
    c.fog((200, 190, 150), .45, .8, .25); lightshafts(c, (255, 230, 170), 5, .16)
    im, d = c.im(); [d.line([(x, c.h), (x + c.R.uniform(-14, 14), c.h - c.R.uniform(30, 90))], fill=int(c.R.uniform(120, 255)), width=2) for x in [c.R.random() * c.w for _ in range(500)]]; c.paint(im, (40, 90, 40), .8, .5); bloom(c, .65, 20, .4)
def crypt(c):
    c.grad((6, 6, 14), (26, 22, 44), 0, 1); im, d = c.im()
    for i in range(7): sc = 1 - i * .11; x = c.w / 2 + (i % 2 * 2 - 1) * 0; wdt = c.w * .22 * sc; top = c.h * .18 + i * c.h * .035; d.rounded_rectangle([c.w / 2 - wdt - i * 12, top, c.w / 2 + wdt + i * 12, c.h], int(wdt), fill=255) if False else None
    for i in range(6, -1, -1):
        sc = 1 - i * .12; wdt = c.w * .30 * sc; top = c.h * (.12 + i * .05); im, d = c.im(); d.rounded_rectangle([c.w / 2 - wdt, top, c.w / 2 + wdt, c.h * 1.1], int(wdt * .9), fill=255); inner = Image.new('L', (c.w, c.h), 0); ImageDraw.Draw(inner).rounded_rectangle([c.w / 2 - wdt * .82, top + wdt * .12, c.w / 2 + wdt * .82, c.h * 1.1], int(wdt * .75), fill=255)
        ring = np.clip(mask_from(im) - mask_from(inner), 0, 1); h = blur(mask_from(im), 8) * 8; ln = lit(h + fbm(c.h, c.w, c.seed + i, 4, 3) * .5, (-.3, -.4, .6), 1.3); c.cv = comp(c.cv, np.array([96, 94, 112], np.float32).reshape(1, 1, 3) / 255 * (.2 + .9 * ln[..., None]) * (.55 + .06 * (6 - i)), ring)
        c.cv = comp(c.cv, np.array([40, 120, 120], np.float32) / 255 * .0 + 0, ring * 0); c.fog((30, 40, 70), .0, 1.0, .06)
    im, d = c.im(); [d.ellipse([x, y, x + r, y + r * .8], fill=255) for x, y, r in [(c.R.random() * c.w, c.h * (.82 + c.R.random() * .16), c.R.uniform(8, 28)) for _ in range(160)]]; c.paint(im, (200, 196, 180), .8, .8)
    im, d = c.im(); [d.ellipse([x - 16, y - 16, x + 16, y + 16], fill=255) for x, y in [(c.w * .22, c.h * .52), (c.w * .78, c.h * .52)]]; c.paint(im, (255, 160, 70), 1.0, 2, 30, 1.4); rune = c.im(); c.cv = screen(c.cv, blur(np.exp(-((np.arange(c.w)[None, :] - c.w / 2) ** 2 + (np.arange(c.h)[:, None] - c.h * .6) ** 2) / 80000.0), 3)[..., None] * np.array([0.05, .25, .3], np.float32)); bloom(c, .5, 20, .5)
def marsh(c):
    c.grad((20, 40, 44), (120, 140, 110), 0, .55); clouds(c, (170, 190, 150), .05, .4, .4, 150); ridge(c, prof(c.w, c.h * .52, 18, 8, 80), (30, 52, 46), 1, (130, 150, 120), .6)
    for _ in range(14):
        x = c.R.random() * c.w; hh = c.R.uniform(110, 260); im, d = c.im(); d.line([(x, c.h * .56), (x + c.R.uniform(-20, 20), c.h * .56 - hh)], fill=255, width=int(hh / 20) + 2); [d.line([(x, c.h * .56 - hh * c.R.uniform(.3, .9)), (x + c.R.uniform(-90, 90), c.h * .56 - hh * c.R.uniform(.6, 1.2))], fill=255, width=3) for _ in range(5)]; c.paint(im, (14, 24, 20), .92)
    im, d = c.im(); d.rectangle([0, c.h * .56, c.w, c.h], fill=255); wat = np.array([30, 60, 56], np.float32) / 255; sky = c.cv[int(c.h * .56) - 1::-1][:int(c.h * .44)] if False else None
    m = mask_from(im); rip = fbm(c.h, c.w, c.seed + 4, 6, 3) * .06; c.cv = comp(c.cv, wat * (1 + rip[..., None]), m); refl = c.cv[:int(c.h * .56)][::-1]; refl = refl[:int(c.h * .44)]; c.cv[int(c.h * .56):int(c.h * .56) + refl.shape[0]] = c.cv[int(c.h * .56):int(c.h * .56) + refl.shape[0]] * .5 + blur(refl, 3) * .5
    for _ in range(90): x = c.R.random() * c.w; hh = c.R.uniform(60, 220); im, d = c.im(); d.line([(x, c.h), (x + c.R.uniform(-16, 16), c.h - hh)], fill=255, width=2); c.paint(im, (10, 20, 14), .95)
    c.fog((150, 180, 140), .5, .72, .3); im, d = c.im(); [d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=255) for x, y in [(c.R.random() * c.w, c.h * (.55 + c.R.random() * .35)) for _ in range(40)]]; c.paint(im, (190, 255, 150), 1.0, 1, 10, 1.2); bloom(c, .7, 14, .4)
def road(c):
    c.grad((40, 24, 70), (255, 130, 70), 0, .55); clouds(c, (255, 170, 130), .1, .45, .4, 170); im, d = c.im(); d.ellipse([c.w * .62, c.h * .36, c.w * .72, c.h * .36 + c.w * .1], fill=255); c.paint(im, (255, 210, 140), 1, 2, 18, 1.4)
    ridge(c, prof(c.w, c.h * .5, 24, 5, 120), (50, 28, 52), 1, (180, 100, 100), .5); im, d = c.im(); d.polygon([(c.w * .45, c.h * .5), (c.w * .55, c.h * .5), (c.w * .98, c.h), (c.w * .02, c.h)], fill=255); m = mask_from(im); asph = ramp(np.clip(.4 + fbm(c.h, c.w, c.seed + 3, 8, 4) * .25, 0, 1), [(0, (92, 56, 40)), (1, (176, 120, 80))]); c.cv = comp(c.cv, asph, m)
    im, d = c.im()
    for i in range(10): t0, t1 = i / 10, (i + .45) / 10; y0 = c.h * (.5 + .5 * t0 ** 1.6); y1 = c.h * (.5 + .5 * t1 ** 1.6); wd = 1 + 14 * t0; d.polygon([(c.w / 2 - wd, y0), (c.w / 2 + wd, y0), (c.w / 2 + wd * 1.6, y1), (c.w / 2 - wd * 1.6, y1)], fill=255)
    c.paint(im, (240, 190, 90), .0); im, d = c.im(); [d.rectangle([x, c.h * .38, x + 6, c.h * .52], fill=255) for x in (c.w * .12, c.w * .86)]; [d.rectangle([x - 70, c.h * .36, x + 80, c.h * .36 + 34], fill=255) for x in (c.w * .12,)]; c.paint(im, (20, 20, 30), 1); im2, d2 = c.im(); d2.rectangle([c.w * .12 - 60, c.h * .365, c.w * .12 + 70, c.h * .365 + 24], fill=255); c.paint(im2, (255, 170, 80), .95, 1, 8, 1.0)
    for i in range(4): im, d = c.im(); x = c.w * (.08 + i * .06); d.line([(0, c.h * (.4 + i * .005)), (c.w, c.h * (.42 + i * .01))], fill=255, width=1)
    c.paint(im, (20, 16, 24), .6); bloom(c, .7, 18, .5)
def mines(c):
    c.grad((12, 10, 18), (30, 22, 30), 0, 1); n = fbm(c.h, c.w, c.seed + 2, 24, 5); rock = ramp(np.clip(.4 + n * .25, 0, 1), [(0, (22, 18, 24)), (1, (96, 80, 80))]); h = n * 14; ln = lit(h, (-.4, -.6, .5), 1.0); c.cv = rock * (.25 + .9 * ln[..., None])
    im, d = c.im(); d.polygon([(c.w * .3, 0), (c.w * .7, 0), (c.w * .62, c.h * .55), (c.w * .38, c.h * .55)], fill=255); tun = blur(mask_from(im), 6); c.cv = comp(c.cv, np.array([4, 4, 8], np.float32) / 255, tun * .92)
    im, d = c.im()
    for i in range(14): t = i / 14; y = c.h * (.55 + .45 * t ** 1.5); wd = c.w * (.07 + .42 * t ** 1.5); d.rectangle([c.w / 2 - wd, y, c.w / 2 + wd, y + 4 + 6 * t], fill=255)
    c.paint(im, (60, 42, 34), .9); im, d = c.im(); [d.line([(c.w / 2 + s * c.w * (.012 + .06 * t), c.h * (.55 + .45 * t ** 1.5)) for t in np.linspace(0, 1, 20)], fill=255, width=4) for s in (-1, 1)]; c.paint(im, (140, 140, 150), .9, .5)
    for _ in range(9): x, y = c.R.random() * c.w, c.R.random() * c.h * .85; im, d = c.im(); d.polygon([(x, y), (x + 16, y - 50), (x + 30, y)], fill=255); c.paint(im, c.R.choice([(25, 227, 255), (123, 224, 160), (255, 79, 216)]), .9, .8, 18, 1.2)
    im, d = c.im(); d.ellipse([c.w * .47, c.h * .38, c.w * .53, c.h * .38 + c.w * .06], fill=255); c.paint(im, (255, 190, 100), 1, 2, 24, 1.6); bloom(c, .55, 22, .55)
def dunes(c):
    c.grad((46, 18, 60), (255, 150, 80), 0, .62); im, d = c.im(); d.ellipse([c.w * .58, c.h * .18, c.w * .58 + c.w * .14, c.h * .18 + c.w * .14], fill=255); c.paint(im, (255, 230, 170), 1.0, 2, 30, 1.6); clouds(c, (255, 180, 150), .08, .4, .3, 160)
    for i, (b, col) in enumerate([(.5, (130, 60, 70)), (.6, (190, 96, 66)), (.72, (224, 140, 80)), (.86, (240, 176, 100))]): p = prof(c.w, c.h * b, 28 - i * 4, 40 + i, 90 - i * 14); ridge(c, p, col, 1, (255, 170, 130), .35 - i * .06, light=(-.9, -.2, .35))
    im, d = c.im(); [d.rectangle([x, c.h * .5 - 70, x + 16, c.h * .5], fill=255) for x in (c.w * .2, c.w * .23, c.w * .27)]; d.polygon([(c.w * .21, c.h * .5 - 70), (c.w * .22, c.h * .5 - 100), (c.w * .23, c.h * .5 - 70)], fill=255); c.paint(im, (80, 40, 60), .95); c.fog((255, 190, 140), .5, .7, .2); bloom(c, .75, 20, .4)
def frost(c):
    c.grad((8, 20, 50), (150, 190, 230), 0, .7); stars(c, 90, .4, .8); n = fbm(c.h, c.w, c.seed + 6, 120, 3); im, d = c.im(); [d.line([(x, c.h * (.12 + .1 * math.sin(x / 260 + k) + .04 * math.sin(x / 70 + k * 3))) for x in range(0, c.w, 12)], fill=255, width=70) for k in (0, 2.1)]; c.paint(im, (80, 255, 190), .28, 40, 38, .5)
    for i, (b, col, snow) in enumerate([(.55, (60, 78, 110), .7), (.7, (86, 106, 140), .9), (.85, (120, 140, 170), 1.0)]):
        p = prof(c.w, c.h * b, 64 - i * 12, 60 + i, 70 - i * 10); ridge(c, p, col, 1, (190, 210, 235), .4 - i * .1, light=(-.6, -.4, .55)); sn = np.clip((c.h * (b + .02) - np.arange(c.h)[:, None] + 40 * fbm(c.h, c.w, c.seed + i, 20, 3)) / 110, 0, 1) * mask_from(Image.fromarray(np.zeros((c.h, c.w), np.uint8)))
    im, d = c.im(); [d.ellipse([x, y, x + r, y + r], fill=255) for x, y, r in [(c.R.random() * c.w, c.R.random() * c.h, c.R.choice([2, 3, 4])) for _ in range(400)]]; c.paint(im, (240, 250, 255), .8, .6); c.fog((200, 225, 255), .6, .9, .3); bloom(c, .75, 16, .35)
def ember(c):
    c.grad((10, 4, 6), (110, 28, 14), 0, .75); clouds(c, (120, 40, 20), .05, .5, .5, 150); ridge(c, prof(c.w, c.h * .55, 30, 12, 100), (30, 16, 16), 1, (150, 50, 20), .5)
    im, d = c.im(); d.polygon([(c.w * .22, c.h), (c.w * .5, c.h * .26), (c.w * .78, c.h)], fill=255); m = mask_from(im); n = fbm(c.h, c.w, c.seed + 1, 8, 5); h = blur(m, 12) * 12 + n * 3; ln = lit(h, (-.7, -.4, .45), 1.0); c.cv = comp(c.cv, np.array([46, 24, 20], np.float32).reshape(1, 1, 3) / 255 * (.3 + 1.1 * ln[..., None]), m)
    im, d = c.im(); d.ellipse([c.w * .46, c.h * .245, c.w * .54, c.h * .30], fill=255)
    for k in range(7): x0 = c.w * (.5 + (k - 3) * .01); pts = [(x0, c.h * .28)]; x = x0; y = c.h * .28
    for k in range(7):
        x = c.w * (.49 + k * .004); y = c.h * .28; pts = [(x, y)]
        for _ in range(26): x += c.R.uniform(-1, 1) * 22 + (k - 3) * 6; y += c.R.uniform(10, 26); pts.append((x, y))
        d.line(pts, fill=255, width=c.R.randint(4, 9))
    lava = fbm(c.h, c.w, c.seed + 5, 6, 3); c.paint(im, ramp(np.clip(.6 + lava * .3, 0, 1), [(0, (255, 90, 20)), (1, (255, 230, 120))]), 1.0, .8, 14, 1.4)
    im, d = c.im(); [d.ellipse([x, y, x + r, y + r], fill=255) for x, y, r in [(c.w * .5 + c.R.gauss(0, c.w * .2), c.R.random() * c.h * .8, c.R.choice([2, 3, 4])) for _ in range(300)]]; c.paint(im, (255, 160, 70), .9, .6, 6, .9); bloom(c, .6, 24, .6)
def citadel(c):
    c.grad((8, 10, 30), (70, 60, 110), 0, .8); stars(c, 120, .5, .8); im, d = c.im(); d.ellipse([c.w * .12, c.h * .12, c.w * .12 + 120, c.h * .12 + 120], fill=255); c.paint(im, (225, 232, 255), 1, 1, 6, 1.0); c.paint(im, (190, 200, 255), .4, 40, 40, 1.0)
    ridge(c, prof(c.w, c.h * .74, 22, 21, 100), (22, 20, 40), 1, (90, 80, 140), .5)
    im, d = c.im(); wins = []
    for i in range(7):
        x = c.w * (.12 + i * .12) + c.R.uniform(-20, 20); hh = c.R.uniform(c.h * .25, c.h * .55); bw = c.R.uniform(60, 110); d.rectangle([x, c.h * .78 - hh, x + bw, c.h * .78 + 30], fill=255); d.polygon([(x - 8, c.h * .78 - hh), (x + bw / 2, c.h * .78 - hh - bw * .9), (x + bw + 8, c.h * .78 - hh)], fill=255)
        for k in range(0, int(bw), 14): d.rectangle([x + k, c.h * .78 - hh - 14, x + k + 8, c.h * .78 - hh], fill=0)
        wins += [(x + bw / 2 - 5, c.h * .78 - hh + 40 + j * 46) for j in range(int(hh // 60))]
    c.paint(im, (14, 12, 28), 1.0); wi, wd = c.im(); [wd.rectangle([x, y, x + 10, y + 20], fill=255) for x, y in wins if c.R.random() < .6]; c.paint(wi, (255, 200, 110), .95, .6, 8, 1.0); c.fog((90, 80, 140), .6, .9, .45); bloom(c, .6, 18, .5)
def abyss(c):
    c.grad((2, 2, 8), (20, 8, 40), 0, 1); y, x = np.mgrid[0:c.h, 0:c.w].astype(np.float32); cx, cy = c.w / 2, c.h * .5; dx, dy = (x - cx) / (c.w * .5), (y - cy) / (c.h * .5) * 1.6; r = np.sqrt(dx * dx + dy * dy) + 1e-3; th = np.arctan2(dy, dx)
    sw = np.sin(th * 3 + 7 / r + fbm(c.h, c.w, c.seed, 120, 3) * 2); band = np.clip(sw * .5 + .5, 0, 1) ** 2 * np.exp(-r * 1.4); c.cv = screen(c.cv, band[..., None] * np.array([.55, .12, .75], np.float32)); c.cv = screen(c.cv, (np.exp(-r * 5) * .9)[..., None] * np.array([.9, .3, .9], np.float32) * .4)
    c.cv = c.cv * (1 - np.exp(-(r / .07) ** -2 if False else -r * 60)[..., None] * 0) ; core = np.exp(-(r / .09) ** 2); c.cv = c.cv * (1 - core[..., None] * .95); ring = np.exp(-((r - .12) / .03) ** 2); c.cv = screen(c.cv, ring[..., None] * np.array([1., .5, .9], np.float32) * .7); stars(c, 160, 1.0, .8); bloom(c, .5, 24, .6)

def frontier(c):
    c.grad((60, 30, 76), (255, 150, 84), 0, .62); clouds(c, (255, 190, 140), .08, .42, .4, 150); im, d = c.im(); d.ellipse([c.w * .66, c.h * .34, c.w * .66 + c.w * .09, c.h * .34 + c.w * .09], fill=255); c.paint(im, (255, 220, 160), 1, 2, 18, 1.5)
    ridge(c, prof(c.w, c.h * .52, 26, 17, 110), (92, 46, 50), 1, (255, 150, 120), .5, light=(-.9, -.2, .35)); ridge(c, prof(c.w, c.h * .58, 18, 19, 90), (62, 32, 40), 1, (220, 120, 110), .4)
    im, d = c.im(); d.rectangle([0, c.h * .7, c.w, c.h], fill=255); c.paint(im, ramp(np.clip(.4 + fbm(c.h, c.w, c.seed + 9, 12, 4) * .25, 0, 1), [(0, (84, 52, 36)), (1, (180, 130, 84))]), 1.0)
    x = -30; im, d = c.im(); wins = []
    while x < c.w:
        bw = c.R.randint(150, 260); bh = c.R.randint(int(c.h * .24), int(c.h * .42)); y0 = c.h * .7 - bh; d.rectangle([x, y0, x + bw, c.h * .72], fill=255)
        if c.R.random() < .6: d.polygon([(x - 6, y0), (x + bw / 2, y0 - 42), (x + bw + 6, y0)], fill=255)
        d.rectangle([x - 14, c.h * .7 - 8, x + bw + 14, c.h * .7 + 10], fill=255); wins.append((x, y0, bw, bh)); x += bw + c.R.randint(6, 40)
    m = mask_from(im); col = np.array([58, 34, 28], np.float32).reshape(1, 1, 3) / 255 * (1 + .35 * fbm(c.h, c.w, c.seed + 4, 3, 3)[..., None]); c.cv = comp(c.cv, col, m); c.cv = comp(c.cv, np.array([20, 12, 12], np.float32) / 255, np.clip(blur(m, 12) - m, 0, 1) * .3)
    wi, wd = c.im()
    for (x0, y0, bw, bh) in wins: [wd.rectangle([x0 + 18 + k * 56, y0 + 40, x0 + 46 + k * 56, y0 + 86], fill=255) for k in range(max(1, int(bw // 70)))]
    c.paint(wi, (255, 190, 100), .95, .6, 6, 1.2); sg, sd = c.im(); sd.rectangle([c.w * .5 - 90, c.h * .43, c.w * .5 + 90, c.h * .43 + 40], fill=255); c.paint(sg, (255, 120, 60), .9, 1, 10, 1.4)
    pm, pd = c.im(); pd.arc([c.w * .08, c.h * .3, c.w * .08 + 120, c.h * .3 + 220], 180, 360, fill=255, width=7); pd.line([(c.w * .08, c.h * .3 + 110), (c.w * .08, c.h * .7)], fill=255, width=7); pd.line([(c.w * .08 + 120, c.h * .3 + 110), (c.w * .08 + 120, c.h * .7)], fill=255, width=7); c.paint(pm, (120, 220, 255), .9, 1, 12, 1.6)
    c.fog((255, 190, 140), .62, .78, .35); im, d = c.im(); [d.ellipse([x, y, x + r, y + r * .6], fill=255) for x, y, r in [(c.R.random() * c.w, c.h * (.72 + c.R.random() * .24), c.R.uniform(3, 9)) for _ in range(220)]]; c.paint(im, (230, 190, 140), .35, 1.2); bloom(c, .7, 18, .45)

AREAS = {'town': frontier, 'forest': forest, 'crypt': crypt, 'marsh': marsh, 'road': road, 'mines': mines, 'dunes': dunes, 'frost': frost, 'ember': ember, 'citadel': citadel, 'abyss': abyss}
def area(name, seed, w=960, h=384): c = C(w, h, seed); AREAS[name](c); return c.out()

def ghosttown(c): # Tombstone Gulch: the frontier town at night, drained of colour and full of pale wisps
    frontier(c); g = c.cv.mean(-1, keepdims=True); c.cv = np.clip((c.cv * .3 + g * .7) * np.array([.78, .9, 1.25], np.float32), 0, 1); im, d = c.im()
    for _ in range(26): x, y, r = c.R.random() * c.w, c.h * (.45 + c.R.random() * .4), c.R.uniform(10, 34); d.ellipse([x - r * .6, y - r, x + r * .6, y + r], fill=255)
    c.paint(im, (190, 215, 255), .35, 8, 12, .6); c.fog((120, 140, 190), .45, .85, .35); bloom(c, .6, 20, .5)
def thorn(c): # Thornwild Court: a glowing fey forest of giant mushrooms
    c.grad((8, 14, 34), (86, 44, 110), 0, .8); stars(c, 70, .4, .6); clouds(c, (150, 90, 190), .05, .4, .35, 150)
    for i, (b, n, hh, col, fk) in enumerate([(.62, 22, (110, 190), (30, 24, 62), .5), (.78, 20, (170, 300), (18, 20, 44), .3), (.95, 14, (260, 420), (10, 12, 30), .1)]): conifers(c, int(c.h * b), n, hh[0], hh[1], col, (120, 80, 170), fk, 40 + i)
    for _ in range(14):
        x, y, r = c.R.random() * c.w, c.h * (.7 + c.R.random() * .28), c.R.uniform(26, 70); im, d = c.im(); d.rectangle([x - r * .14, y - r * .2, x + r * .14, y + r * .9], fill=255); c.paint(im, (180, 170, 200), .9, .6, 4)
        cap, cd = c.im(); cd.chord([x - r, y - r * .8, x + r, y + r * .6], 180, 360, fill=255); c.paint(cap, c.R.choice([(255, 90, 200), (90, 230, 255), (150, 255, 160), (190, 130, 255)]), .9, .8, 10, 1.4)
    im, d = c.im(); [d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=255) for x, y in [(c.R.random() * c.w, c.R.random() * c.h) for _ in range(120)]]; c.paint(im, (255, 255, 180), 1, 1, 10, 1.4); c.fog((150, 90, 200), .55, .9, .3); bloom(c, .55, 22, .55)
def aurora(c): # Starship Aurora: a wrecked ship corridor lit by red emergency lights
    crypt(c); g = c.cv.mean(-1, keepdims=True); c.cv = np.clip(c.cv * .4 + g * .6 * np.array([.8, .95, 1.2], np.float32), 0, 1); y, x = np.mgrid[0:c.h, 0:c.w].astype(np.float32); pulse = np.exp(-(((x - c.w / 2) / (c.w * .35)) ** 2 + ((y - c.h * .5) / (c.h * .5)) ** 2))
    c.cv = screen(c.cv, (pulse * .5)[..., None] * np.array([.9, .08, .06], np.float32)); im, d = c.im(); [d.line([(c.w * c.R.uniform(.3, .7), c.h * .2), (c.w * c.R.uniform(.3, .7) + c.R.uniform(-60, 60), c.h * c.R.uniform(.3, .8))], fill=255, width=2) for _ in range(12)]; c.paint(im, (255, 200, 90), .9, .6, 5, 1.2)
    im, d = c.im(); [d.line([(0, y0), (c.w, y0 + 30)], fill=255, width=3) for y0 in range(int(c.h * .82), c.h, 28)]; c.paint(im, (90, 100, 120), .5); bloom(c, .5, 22, .5)
def reach(c): # The Drowned Reach: a sunken kingdom
    c.grad((4, 26, 54), (24, 124, 150), 0, 1); lightshafts(c, (170, 255, 255), 8, .2); ridge(c, prof(c.w, c.h * .82, 30, 51, 90), (10, 40, 52), 1, (30, 110, 130), .5)
    im, d = c.im(); d.polygon([(c.w * .55, c.h * .86), (c.w * .62, c.h * .56), (c.w * .78, c.h * .5), (c.w * .9, c.h * .62), (c.w * .84, c.h * .9)], fill=255); d.line([(c.w * .7, c.h * .52), (c.w * .7, c.h * .2)], fill=255, width=10); c.paint(im, (14, 36, 44), .96)
    for _ in range(60): x, y, r = c.R.random() * c.w, c.h * (.84 + c.R.random() * .15), c.R.uniform(10, 40); im, d = c.im(); d.polygon([(x - r * .3, y), (x, y - r * 1.3), (x + r * .3, y)], fill=255); c.paint(im, c.R.choice([(255, 110, 130), (255, 170, 90), (190, 110, 255)]), .8, .6, 3, .4)
    im, d = c.im(); [d.ellipse([x - r, y - r, x + r, y + r], outline=255, width=2) for x, y, r in [(c.R.random() * c.w, c.R.random() * c.h, c.R.uniform(3, 12)) for _ in range(110)]]; c.paint(im, (200, 255, 255), .6, .8); c.fog((60, 160, 180), .3, .7, .3); bloom(c, .6, 20, .45)
def railyard(c): # Brimstone Rail Yard: rails running into a hellmouth, with a locomotive's headlight
    c.grad((10, 4, 8), (150, 34, 20), 0, .72); clouds(c, (160, 50, 30), .05, .5, .5, 150); ridge(c, prof(c.w, c.h * .5, 24, 61, 100), (26, 12, 14), 1, (160, 60, 30), .5)
    im, d = c.im(); d.polygon([(c.w * .47, c.h * .5), (c.w * .53, c.h * .5), (c.w * .95, c.h), (c.w * .05, c.h)], fill=255); m = mask_from(im); c.cv = comp(c.cv, np.array([30, 20, 22], np.float32) / 255 * (1 + .3 * fbm(c.h, c.w, c.seed + 4, 8, 3)[..., None]), m)
    im, d = c.im(); [d.line([(c.w / 2 + s * c.w * .012, c.h * .5), (c.w / 2 + s * c.w * .34, c.h)], fill=255, width=6) for s in (-1, 1)]; [d.line([(c.w / 2 - c.w * (.012 + .33 * t), c.h * (.5 + .5 * t)), (c.w / 2 + c.w * (.012 + .33 * t), c.h * (.5 + .5 * t))], fill=255, width=2 + int(8 * t)) for t in np.linspace(0.02, 1, 18) ** 1.5]; c.paint(im, (120, 120, 130), .9, .5)
    im, d = c.im(); d.rectangle([c.w * .44, c.h * .3, c.w * .56, c.h * .5], fill=255); d.rectangle([c.w * .46, c.h * .22, c.w * .49, c.h * .3], fill=255); c.paint(im, (12, 10, 14), 1); hl, hd = c.im(); hd.ellipse([c.w * .485, c.h * .4, c.w * .515, c.h * .4 + c.w * .03], fill=255); c.paint(hl, (255, 230, 160), 1, 2, 22, 1.8)
    sm = np.clip(fbm(c.h, c.w, c.seed + 8, 60, 4) * .5 + .3, 0, 1) * np.clip(1 - np.abs((np.arange(c.w)[None, :] - c.w * .475) / (c.w * .16)), 0, 1) * (np.arange(c.h)[:, None] < c.h * .3); c.cv = comp(c.cv, np.array([70, 50, 50], np.float32) / 255, np.clip(sm, 0, .8))
    im, d = c.im(); [d.ellipse([x, y, x + r, y + r], fill=255) for x, y, r in [(c.w * .5 + c.R.gauss(0, c.w * .25), c.R.random() * c.h * .8, c.R.choice([2, 3, 4])) for _ in range(200)]]; c.paint(im, (255, 150, 60), .9, .6, 5, .9); bloom(c, .6, 22, .6)
NEW_AREAS = {'gulch': ghosttown, 'thorn': thorn, 'aurora': aurora, 'reach': reach, 'rail': railyard}
AREAS.update(NEW_AREAS)
def run_new(pub):
    gi = os.path.join(pub, 'guide/img'); os.makedirs(gi, exist_ok=True)
    for i, k in enumerate(NEW_AREAS): save_jpg(area(k, 200 + i), os.path.join(gi, f'area-{k}.jpg'), 86); print('area', k, flush=True)

# ---------------- banners ----------------
def circuits(w, h, seed, col):
    c = C(w, h, seed); c.grad((4, 8, 16), (8, 22, 34)); im, d = c.im()
    for _ in range(90):
        x, y = c.R.randint(0, c.w), c.R.randint(0, c.h); pts = [(x, y)]
        for _ in range(c.R.randint(3, 7)): x += c.R.choice([-1, 1]) * c.R.randint(30, 160) if c.R.random() < .5 else 0; y += c.R.choice([-1, 1]) * c.R.randint(20, 100) if c.R.random() > .5 else 0; pts.append((x, y))
        d.line(pts, fill=255, width=c.R.choice([3, 4, 6]))
    m = mask_from(im); h2 = blur(m, 2.2) * 6; ln = lit(h2, (-.5, -.6, .5), 1.2); c.cv = comp(c.cv, np.array([150, 120, 60], np.float32).reshape(1, 1, 3) / 255 * (.35 + .8 * ln[..., None]), m)
    pads = c.im(); pim, pd = pads
    for _ in range(70): x, y = c.R.randint(0, c.w), c.R.randint(0, c.h); r = c.R.choice([6, 8, 12]); pd.ellipse([x - r, y - r, x + r, y + r], fill=255)
    pm = mask_from(pim); c.cv = comp(c.cv, np.array([200, 160, 80], np.float32) / 255, pm * .9)
    chip = c.im(); cim, cd = chip; cd.rounded_rectangle([c.w * .4, c.h * .25, c.w * .62, c.h * .75], 20, fill=255); cm = mask_from(cim); hh = blur(cm, 8) * 8; c.cv = comp(c.cv, np.array([22, 24, 30], np.float32).reshape(1, 1, 3) / 255 * (.4 + .9 * lit(hh, (-.5, -.6, .5), 1.2)[..., None]), cm)
    glw = c.im(); gim, gd = glw
    for _ in range(40): x, y = c.R.randint(0, c.w), c.R.randint(0, c.h); gd.ellipse([x - 8, y - 8, x + 8, y + 8], fill=255)
    c.paint(gim, col, .95, 1, 18, 1.4); bk, bd = c.im(); [bd.ellipse([x - r, y - r, x + r, y + r], fill=255) for x, y, r in [(c.R.randint(0, c.w), c.R.randint(0, c.h), c.R.randint(30, 90)) for _ in range(14)]]; c.paint(bk, col, .18, 14); bloom(c, .6, 20, .5); return c.out()
def sigils(w, h, seed):
    c = C(w, h, seed); c.grad((10, 4, 26), (36, 12, 60)); y, x = np.mgrid[0:c.h, 0:c.w].astype(np.float32); cx, cy = c.w / 2, c.h / 2
    n = fbm(c.h, c.w, seed, 160, 4); c.cv = screen(c.cv, np.clip(n, 0, 1)[..., None] * np.array([.18, .05, .3], np.float32))
    im, d = c.im()
    for r in (150, 220, 300, 380): d.ellipse([cx - r, cy - r * .55, cx + r, cy + r * .55], outline=255, width=4)
    for k in range(2):
        pts = [(cx + math.cos((i * 144 + 90 + k * 36) * math.pi / 180) * 300, cy - math.sin((i * 144 + 90 + k * 36) * math.pi / 180) * 165) for i in range(5)]; d.polygon(pts, outline=255, width=3)
    for i in range(60): a = i / 60 * 2 * math.pi; d.ellipse([cx + math.cos(a) * 380 - 4, cy + math.sin(a) * 209 - 4, cx + math.cos(a) * 380 + 4, cy + math.sin(a) * 209 + 4], fill=255)
    c.paint(im, (180, 110, 255), .95, .6, 16, 1.5); c.paint(im, (255, 160, 240), .5, 1.5); stars(c, 160, 1.0, .9); bloom(c, .55, 22, .6); return c.out()
def forge(w, h, seed):
    c = C(w, h, seed); c.grad((10, 6, 8), (36, 18, 12)); n = fbm(c.h, c.w, seed, 30, 5); c.cv = c.cv * (1 + n[..., None] * .2)
    im, d = c.im(); d.rectangle([c.w * .28, c.h * .5, c.w * .72, c.h * .62], fill=255); d.polygon([(c.w * .26, c.h * .5), (c.w * .74, c.h * .5), (c.w * .66, c.h * .42), (c.w * .34, c.h * .42)], fill=255); d.rectangle([c.w * .4, c.h * .62, c.w * .6, c.h], fill=255); m = mask_from(im); hh = blur(m, 6) * 6; c.cv = comp(c.cv, np.array([46, 44, 50], np.float32).reshape(1, 1, 3) / 255 * (.3 + .9 * lit(hh, (-.4, -.6, .5), 1.4)[..., None]), m)
    hot = c.im(); him, hd = hot; hd.rounded_rectangle([c.w * .36, c.h * .39, c.w * .62, c.h * .43], 8, fill=255); hm = mask_from(him); hc = ramp(np.clip(hm * 1.0, 0, 1), [(0, (255, 120, 20)), (1, (255, 245, 190))]); c.cv = comp(c.cv, hc, hm); c.cv = screen(c.cv, blur(hm, 30)[..., None] * np.array([1.0, .45, .1], np.float32) * 1.3)
    sp, sd = c.im()
    for _ in range(260): x, y = c.w * .5 + c.R.gauss(0, 160), c.h * .4 - abs(c.R.gauss(0, 120)); sd.line([(x, y), (x + c.R.uniform(-10, 10), y + c.R.uniform(4, 16))], fill=255, width=2)
    c.paint(sp, (255, 190, 80), .95, .6, 5, 1.2); bloom(c, .6, 24, .6); return c.out()
def lab(w, h, seed):
    c = C(w, h, seed); c.grad((8, 8, 20), (24, 14, 40)); im, d = c.im()
    for sy in (c.h * .38, c.h * .72): d.rectangle([0, sy, c.w, sy + 14], fill=255)
    c.paint(im, (60, 52, 70), 1.0, 0, 0)
    for row, sy in enumerate((c.h * .38, c.h * .72)):
        for i in range(16):
            x = c.w * (i + .5) / 16 + c.R.uniform(-14, 14); bh = c.R.uniform(70, 150); bw = c.R.uniform(30, 54); col = c.R.choice([(255, 79, 216), (25, 227, 255), (123, 224, 160), (255, 211, 74), (154, 107, 255)]); im, d = c.im(); d.rounded_rectangle([x - bw / 2, sy - bh, x + bw / 2, sy], 12, fill=255); d.rectangle([x - bw * .2, sy - bh - 26, x + bw * .2, sy - bh + 4], fill=255); bm = mask_from(im); c.cv = comp(c.cv, np.array([20, 18, 30], np.float32) / 255, bm * .55); fl, fd = c.im(); fd.rounded_rectangle([x - bw / 2 + 5, sy - bh * c.R.uniform(.4, .8), x + bw / 2 - 5, sy - 4], 10, fill=255); c.paint(fl, col, .85, .6, 14, 1.1); hi, hd = c.im(); hd.line([(x - bw * .28, sy - bh + 14), (x - bw * .28, sy - 14)], fill=255, width=4); c.paint(hi, (255, 255, 255), .4, 1.5)
    bloom(c, .5, 22, .55); return c.out()
def holomap(w, h, seed):
    c = C(w, h, seed); c.grad((4, 12, 22), (6, 26, 40)); im, d = c.im()
    for x in range(0, c.w, 60): d.line([(x, 0), (x, c.h)], fill=70, width=1)
    for y in range(0, c.h, 60): d.line([(0, y), (c.w, y)], fill=70, width=1)
    c.paint(im, (25, 227, 255), .8, .6, 2, .4); im, d = c.im()
    pts = [(c.R.randint(120, c.w - 120), c.R.randint(80, c.h - 80)) for _ in range(9)]; d.line(pts, fill=255, width=4); [d.ellipse([x - 12, y - 12, x + 12, y + 12], fill=255) for x, y in pts]; c.paint(im, (255, 211, 74), .95, .6, 10, 1.4)
    t = fbm(c.h, c.w, seed, 80, 4); cont = np.clip(1 - np.abs(np.sin(t * 9)), 0, 1) ** 8; c.cv = screen(c.cv, cont[..., None] * np.array([.1, .55, .7], np.float32)); bloom(c, .55, 18, .5); return c.out()
def montage(paths, w, h, seed, tint=(255, 79, 216)):
    c = np.zeros((h, w, 3), np.float32); n = len(paths); pw = int(w / n * 1.7)
    for i, p in enumerate(paths):
        im = Image.open(p).convert('RGB'); sc = h * 1.25 / im.height; im = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS); a = np.asarray(im, np.float32) / 255; x0 = int((i + .5) / n * w - a.shape[1] / 2); y0 = int(h * .0 - h * .08)
        mask = np.zeros((h, w), np.float32); xs = np.arange(a.shape[1]); fade = np.clip(np.minimum(xs, a.shape[1] - 1 - xs) / (a.shape[1] * .35), 0, 1)
        layer = np.zeros((h, w, 3), np.float32); ys = min(h, a.shape[0] + y0)
        for xx in range(a.shape[1]):
            X = x0 + xx
            if 0 <= X < w: hh = ys - max(y0, 0); layer[max(y0, 0):ys, X] = a[max(-y0, 0):max(-y0, 0) + hh, xx]; mask[max(y0, 0):ys, X] = fade[xx]
        c = c * (1 - mask[..., None]) + layer * mask[..., None]
    c = c * np.array([.95, .9, 1.0], np.float32); return np.clip(vignette(c, .35), 0, 1)

BANNER = {'home': ('area', 'town', 5), 'howto': ('area', 'town', 9), 'interface': ('circuits', (25, 227, 255)), 'commands': ('circuits', (123, 224, 160)), 'faq': ('sigils',), 'classes': ('montage', 'player', ['magician-f', 'barbarian-m', 'wirewalker-f', 'gunslinger-m', 'cleric-f', 'necromancer-n', 'druid-f', 'engineer-m']),
          'remorting': ('montage', 'player', ['dragon-f', 'android-m', 'shapeshifter-n', 'dragon-m', 'android-f']), 'experience': ('area', 'citadel', 4), 'combat': ('area', 'ember', 8), 'cyberware': ('circuits', (255, 79, 216)), 'spells': ('sigils',), 'tradeskills': ('forge',), 'toolsbag': ('forge',),
          'materials': ('area', 'mines', 6), 'gear': ('forge',), 'consumables': ('lab',), 'shops': ('area', 'town', 11), 'map': ('holomap',), 'areas': ('panorama',), 'bestiary': ('area', 'marsh', 3), 'npcs': ('montage', 'npc', ['torv', 'elara', 'brann', 'mara', 'hale', 'greta', 'sael', 'voss'])}

def run(pub):
    gi = os.path.join(pub, 'guide/img'); os.makedirs(gi, exist_ok=True); t0 = time.time(); cache = {}
    for i, k in enumerate(AREAS):
        a = area(k, 100 + i); cache[k] = a; save_jpg(a, os.path.join(gi, f'area-{k}.jpg'), 86); print('area', k, round(time.time() - t0, 1), flush=True)
    for name, spec in BANNER.items():
        kind = spec[0]; w, h = 1600, 400
        if kind == 'area': a = area(spec[1], spec[2] * 31, w, h)
        elif kind == 'circuits': a = circuits(w, h, sum(map(ord, name)) % 997, spec[1])
        elif kind == 'sigils': a = sigils(w, h, sum(map(ord, name)) % 991 + 5)
        elif kind == 'forge': a = forge(w, h, sum(map(ord, name)) % 983 + 3)
        elif kind == 'lab': a = lab(w, h, 12)
        elif kind == 'holomap': a = holomap(w, h, 14)
        elif kind == 'panorama':
            names = ['town', 'forest', 'marsh', 'dunes', 'frost']; a = np.zeros((h, w, 3), np.float32)
            for j, n in enumerate(names): im = Image.fromarray((cache[n] * 255).astype(np.uint8)).resize((int(w / 5 * 1.5), h), Image.LANCZOS); b = np.asarray(im, np.float32) / 255; x0 = int(j * w / 5 - w / 5 * .25); xs = np.arange(b.shape[1]); fade = np.clip(np.minimum(xs, b.shape[1] - 1 - xs) / (b.shape[1] * .3), 0, 1); X0, X1 = max(x0, 0), min(x0 + b.shape[1], w); a[:, X0:X1] = a[:, X0:X1] * (1 - fade[X0 - x0:X1 - x0][None, :, None]) + b[:, X0 - x0:X1 - x0] * fade[X0 - x0:X1 - x0][None, :, None]
        elif kind == 'montage': a = montage([os.path.join(pub, 'img', 'player' if spec[1] == 'player' else 'npc', n + '.jpg') for n in spec[2]], w, h, 1)
        save_jpg(a, os.path.join(gi, f'banner-{name}.jpg'), 84); print('banner', name, round(time.time() - t0, 1), flush=True)
