"""Shared helpers for the MULTIVERSE MUD art renderer (numpy + Pillow + scipy). All images are generated procedurally; no third-party art."""
import math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter

def blur(a, s, wrap=False):
    mode = 'wrap' if wrap else 'nearest'
    return gaussian_filter(a, (s, s, 0) if a.ndim == 3 else s, mode=mode)

def fbm(h, w, seed, base=40, octaves=5, wrap=False, persistence=0.55):
    r = np.random.default_rng(abs(int(seed))); out = np.zeros((h, w), np.float32); amp, tot, s = 1.0, 0.0, float(base)
    for _ in range(octaves):
        n = gaussian_filter(r.random((h, w)).astype(np.float32), max(s, 0.6), mode='wrap' if wrap else 'nearest')
        out += (n - n.mean()) / (n.std() + 1e-6) * amp; tot += amp; amp *= persistence; s /= 2
    return out / tot

def n01(a): return (a - a.min()) / (a.max() - a.min() + 1e-9)

def ramp(t, stops):
    pos = [p for p, _ in stops]; cols = np.array([c for _, c in stops], np.float32) / 255.0
    return np.stack([np.interp(t, pos, cols[:, i]) for i in range(3)], -1).astype(np.float32)

def lit(height, light=(-0.55, -0.6, 0.55), strength=2.0, wrap=False):
    if wrap:
        gx = (np.roll(height, -1, 1) - np.roll(height, 1, 1)) / 2; gy = (np.roll(height, -1, 0) - np.roll(height, 1, 0)) / 2
    else:
        gy, gx = np.gradient(height)
    nx, ny = -gx * strength, -gy * strength; l = np.sqrt(nx * nx + ny * ny + 1); nx, ny, nz = nx / l, ny / l, 1 / l
    lx, ly, lz = light; ln = math.sqrt(lx * lx + ly * ly + lz * lz)
    return np.clip((nx * lx + ny * ly + nz * lz) / ln, 0, 1).astype(np.float32)

def to_img(a): return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
def from_img(im): return np.asarray(im.convert('RGB'), np.float32) / 255.0
def mask_from(im): return np.asarray(im.convert('L'), np.float32) / 255.0

def comp(base, color, alpha):
    a = alpha[..., None] if alpha.ndim == 2 else alpha
    col = color if isinstance(color, np.ndarray) else np.array(color, np.float32).reshape(1, 1, 3) / (255.0 if max(color) > 1.5 else 1.0)
    return base * (1 - a) + col * a

def screen(base, add): return 1 - (1 - base) * (1 - np.clip(add, 0, 1))

def grain(a, amt=0.02, seed=0):
    return a + np.random.default_rng(seed).normal(0, amt, a.shape[:2])[..., None].astype(np.float32)

def vignette(a, k=0.35):
    h, w = a.shape[:2]; y, x = np.mgrid[0:h, 0:w]; d = np.sqrt(((x - w / 2) / (w / 2)) ** 2 + ((y - h / 2) / (h / 2)) ** 2)
    return a * (1 - k * np.clip(d - 0.35, 0, 1.2)[..., None] ** 1.5)

def save_jpg(a, path, q=88):
    to_img(a).save(path, 'JPEG', quality=q, optimize=True, subsampling=0)
