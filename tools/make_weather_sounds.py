"""Synthesizes the weather sounds (original, CC0): rain.wav (loop), thunder.wav, tornado.wav (loop). Usage: python3 tools/make_weather_sounds.py"""
import wave, os
import numpy as np
SR = 22050; OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'sounds'); rng = np.random.default_rng(7)
def filt(x, lo=None, hi=None):  # FFT band-pass: keep lo..hi Hz
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); m = np.ones_like(f)
    if lo: m *= 1 / (1 + (lo / np.maximum(f, 1e-6)) ** 4)
    if hi: m *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * m, len(x))
def loop(x, fade):  # make x loop seamlessly: equal-power crossfade of its tail into its head
    n = len(x) - fade; t = np.linspace(0, np.pi / 2, fade); out = x[:n].copy()
    out[:fade] = x[:fade] * np.sin(t) + x[n:] * np.cos(t); return out
def save(name, x, peak=.8, fade=False):
    x = x / max(1e-9, np.abs(x).max()) * peak
    if fade: k = int(SR * .05); x[-k:] *= np.linspace(1, 0, k)
    with wave.open(os.path.join(OUT, name), 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype('<i2').tobytes())
os.makedirs(OUT, exist_ok=True)
# ---- rain: a hiss of filtered noise plus lots of tiny drops, 8 second seamless loop ----
L, X = 8.0, 1.0; n = int(SR * (L + X)); t = np.arange(n) / SR
hiss = filt(rng.standard_normal(n), 900, 9000) * (1 + .12 * np.sin(2 * np.pi * .25 * t + 1))
drops = np.zeros(n)
for i in rng.integers(0, n - 400, int(110 * (L + X))):
    k = np.arange(300); drops[i:i + 300] += rng.uniform(.2, 1) * np.exp(-k / rng.uniform(14, 40)) * np.sin(2 * np.pi * rng.uniform(1800, 5200) * k / SR)
low = filt(rng.standard_normal(n), 150, 700) * .5  # roof / ground wash
save('rain.wav', loop(hiss / np.abs(hiss).max() * .55 + drops / np.abs(drops).max() * .55 + low / np.abs(low).max() * .25, int(SR * X)), .75)
# ---- thunder: a sharp crack, then a long rolling rumble, 6 seconds ----
d = 6.0; n = int(SR * d); t = np.arange(n) / SR
crack = filt(rng.standard_normal(n), 300, 5000) * np.exp(-t / .08) * (t < .5)
rum = np.cumsum(rng.standard_normal(n)); rum = filt(rum - np.linspace(rum[0], rum[-1], n), 25, 170)
env = np.minimum(1, t / .35) * np.exp(-t / 1.7)
for c, a in ((1.3, .5), (2.3, .45), (3.4, .3)): env += a * np.exp(-((t - c) / .35) ** 2) * np.exp(-t / 3)  # secondary rolls
mid = filt(rng.standard_normal(n), 60, 420) * env * .5
th = crack / np.abs(crack).max() * .9 + rum / np.abs(rum).max() * env * 1.1 + mid / np.abs(mid).max() * .35
save('thunder.wav', th, .85, fade=True)
# ---- tornado: a deep roar with a swirling whistle and flying debris, 10 second seamless loop ----
L, X = 10.0, 1.0; n = int(SR * (L + X)); t = np.arange(n) / SR; w0 = 1 / L
roar = filt(np.cumsum(rng.standard_normal(n)) * .02 + rng.standard_normal(n) * .3, 40, 650)
roar *= 1 + .35 * np.sin(2 * np.pi * 4 * w0 * t) + .2 * np.sin(2 * np.pi * 9 * w0 * t + 2)
whistle = filt(rng.standard_normal(n), 350, 1300) * (.5 + .5 * np.sin(2 * np.pi * 3 * w0 * t + 1)) ** 1.5
deb = np.zeros(n)
for i in rng.integers(0, n - 500, int(22 * (L + X))): k = np.arange(400); deb[i:i + 400] += rng.uniform(.3, 1) * np.exp(-k / rng.uniform(20, 70)) * rng.standard_normal(400)
rumble = np.sin(2 * np.pi * 48 * t + 2.5 * np.sin(2 * np.pi * 5 * w0 * t)) * (.6 + .4 * np.sin(2 * np.pi * 2 * w0 * t))
save('tornado.wav', loop(roar / np.abs(roar).max() + whistle / np.abs(whistle).max() * .35 + deb / np.abs(deb).max() * .25 + rumble * .35, int(SR * X)), .8)
print('wrote rain.wav, thunder.wav, tornado.wav to', os.path.abspath(OUT))
