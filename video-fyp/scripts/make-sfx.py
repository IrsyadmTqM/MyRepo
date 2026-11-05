"""Bikin efek suara sederhana (tanpa file dari internet, jadi bebas hak cipta).

Jalankan:  python3 scripts/make-sfx.py
Hasilnya ada di public/sfx/*.wav
"""
import os
import wave

import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def t(dur):
    return np.linspace(0, dur, int(SR * dur), endpoint=False)


def env(n, attack=0.005, release=None):
    e = np.ones(n)
    a = max(1, int(SR * attack))
    e[:a] = np.linspace(0, 1, a)
    if release:
        r = min(n, int(SR * release))
        e[-r:] *= np.linspace(1, 0, r)
    return e


def save(name, x, gain=0.8):
    x = x / (np.max(np.abs(x)) + 1e-9) * gain
    data = (x * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


# tick: klik jam pendek
tt = t(0.05)
tick = np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt * 140)
tick += rng.normal(0, 1, len(tt)) * np.exp(-tt * 400) * 0.4
save("tick.wav", tick, 0.45)

# pop: bunyi muncul (sweep naik)
tt = t(0.12)
freq = 380 + 900 * (tt / tt[-1])
pop = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-tt * 30)
save("pop.wav", pop, 0.6)

# whoosh: noise yang di-filter, naik lalu turun
tt = t(0.45)
noise = rng.normal(0, 1, len(tt))
kernel = np.ones(24) / 24
noise = np.convolve(noise, kernel, mode="same")
shape = np.sin(np.pi * tt / tt[-1]) ** 2
save("whoosh.wav", noise * shape, 0.5)

# ding: lonceng kecil
tt = t(1.2)
ding = (
    np.sin(2 * np.pi * 1318.5 * tt)
    + 0.5 * np.sin(2 * np.pi * 2637 * tt)
    + 0.25 * np.sin(2 * np.pi * 3955.5 * tt)
) * np.exp(-tt * 4.5) * env(len(tt), 0.002)
save("ding.wav", ding, 0.55)

# scribble: bunyi nulis di buku (noise dengan ritme)
tt = t(0.6)
noise = rng.normal(0, 1, len(tt))
noise = np.diff(noise, prepend=0)  # lebih "kering"
rhythm = (np.sin(2 * np.pi * 9 * tt) > 0.2).astype(float)
rhythm = np.convolve(rhythm, np.ones(200) / 200, mode="same")
save("scribble.wav", noise * rhythm * env(len(tt), 0.01, 0.1), 0.25)

# blip: notifikasi kecil (2 nada)
tt = t(0.16)
half = len(tt) // 2
blip = np.concatenate([
    np.sin(2 * np.pi * 880 * tt[:half]),
    np.sin(2 * np.pi * 1320 * tt[half:]),
]) * env(len(tt), 0.003, 0.05)
save("blip.wav", blip, 0.4)

# error: bunyi "salah" rendah untuk skip
tt = t(0.22)
err = np.sign(np.sin(2 * np.pi * 180 * tt)) * np.exp(-tt * 12)
err = np.convolve(err, np.ones(30) / 30, mode="same")
save("skip.wav", err, 0.3)

print("SFX dibuat di", os.path.abspath(OUT))
