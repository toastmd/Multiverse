"""Synthesizes the game's original sound effects (public domain / CC0): login, legendary find, tradeskill level-up. Usage: python3 tools/make_sounds.py"""
import wave, os
import numpy as np
SR = 44100; OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'sounds')
def tone(f, d, vol=1.0, harm=(1, .5, .25, .12), atk=.005, dec=6.0):
    t = np.arange(int(SR * d)) / SR; w = sum(a * np.sin(2 * np.pi * f * (i + 1) * t) for i, a in enumerate(harm))
    env = np.minimum(1, t / atk) * np.exp(-dec * t); return vol * w * env / max(1, sum(harm))
def place(buf, snd, at): i = int(SR * at); buf[i:i + len(snd)] += snd[:len(buf) - i]
def save(name, buf):
    buf = buf / max(1e-9, np.abs(buf).max()) * .7; fade = int(SR * .02); buf[-fade:] *= np.linspace(1, 0, fade)
    with wave.open(os.path.join(OUT, name), 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((buf * 32767).astype('<i2').tobytes())
N = {'C4': 261.63, 'E4': 329.63, 'G4': 392.0, 'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'G5': 783.99, 'A5': 880.0, 'C6': 1046.5, 'E6': 1318.5, 'G6': 1568.0, 'A6': 1760.0}
os.makedirs(OUT, exist_ok=True)
# login: a warm rising four-note chime
b = np.zeros(int(SR * 1.3))
for i, n in enumerate(['C5', 'E5', 'G5', 'C6']): place(b, tone(N[n], 0.9, 1.0, (1, .4, .2, .1), dec=3.2), i * .13)
place(b, tone(N['C6'] * 2, .5, .25, (1,), dec=6), .45); save('login.wav', b)
# legendary find: a short fanfare with a shimmering sparkle on top
b = np.zeros(int(SR * 2.6))
for i, n in enumerate(['G4', 'C5', 'E5', 'G5']): place(b, tone(N[n], .55, .8, (1, .6, .4, .3, .2), atk=.02, dec=2.2), i * .16)
for n, v in (('C5', .7), ('E5', .7), ('G5', .7), ('C6', .6)): place(b, tone(N[n], 1.6, v, (1, .5, .3, .15), atk=.03, dec=1.6), .75)
for i in range(14): place(b, tone([N['E6'], N['G6'], N['A6'], N['C6'] * 2][i % 4], .35, .22, (1, .3), dec=9), 1.0 + i * .085)
save('legend.wav', b)
# tradeskill advancement: a quick two-note "ding-ding" with a little pluck
b = np.zeros(int(SR * .8)); place(b, tone(N['A5'], .45, .9, (1, .5, .2), dec=7), 0); place(b, tone(N['E6'], .6, 1.0, (1, .45, .2), dec=5.5), .11); place(b, tone(N['A6'], .3, .3, (1,), dec=12), .11); save('skill.wav', b)
print('wrote login.wav, legend.wav, skill.wav to', os.path.abspath(OUT))
