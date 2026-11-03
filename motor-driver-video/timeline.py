"""Timeline bersama: posisi adegan, waktu kata, kecepatan motor, dan event SFX."""
import json, os, subprocess
import numpy as np
from script import SCENES

BUILD = os.environ.get("BUILD", "build")
FPS, W, H = 30, 1080, 1920
LEAD = {"hook": 0.45}
DEFAULT_LEAD, TAIL, OUTRO_TAIL = 0.25, 0.45, 2.2

TITLES = {
    "hook": ["KENAPA MOTORNYA", "NGGAK MUTER?"],
    "problem": ["MASALAHNYA:", "ARUS LISTRIK"],
    "analogy": ["SOLUSINYA:", "MOTOR DRIVER"],
    "hbridge": ["MAJU & MUNDUR?", "H-BRIDGE!"],
    "pwm": ["ATUR KECEPATAN?", "PAKAI PWM!"],
    "examples": ["MOTOR DRIVER", "YANG POPULER"],
    "outro": ["INTINYA..."],
}


def _dur(p):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                   "-of", "csv=p=0", p])
    return float(out)


_words = json.load(open(f"{BUILD}/words.json"))
scenes, _t = [], 0.0
for key, text in SCENES:
    d = _dur(f"{BUILD}/{key}.mp3")
    lead = LEAD.get(key, DEFAULT_LEAD)
    length = lead + d + (OUTRO_TAIL if key == "outro" else TAIL)
    toks = text.split()
    raw = _words[key]
    ws = []
    for i, w in enumerate(raw):
        punct = toks[i][-1] in ",.?!:" if len(toks) == len(raw) else False
        ws.append(dict(w=w["w"].strip(".,?!"), s=lead + w["s"], e=lead + w["s"] + w["d"], p=punct))
    scenes.append(dict(key=key, start=_t, len=length, lead=lead, vdur=d, words=ws, idx=len(scenes)))
    _t += length
TOTAL = _t
NFRAMES = int(np.ceil(TOTAL * FPS))
SC = {s["key"]: s for s in scenes}


def wt(key, i):
    """Waktu lokal (detik dari awal adegan) kata ke-i."""
    return SC[key]["words"][i]["s"]


def G(key, tl):
    return SC[key]["start"] + tl


def scene_at(t):
    for s in scenes:
        if t < s["start"] + s["len"]:
            return s
    return scenes[-1]


def sstep(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


# ---------- kecepatan motor (putaran/detik), dipakai visual & audio ----------
SR_CTRL = 1000
_tt = np.arange(int(TOTAL * SR_CTRL) + SR_CTRL) / SR_CTRL


def duty_pwm(tl):
    """Duty cycle PWM (0..1) pada waktu lokal adegan pwm."""
    tl = np.asarray(tl, dtype=float)
    a, b = wt("pwm", 5) + 0.3, wt("pwm", 12)
    c = wt("pwm", 17) + 0.7
    d = np.where(tl < a, 0.0, 0.5)
    ramp = 0.15 + 0.8 * sstep((tl - b) / (c - b))
    return np.where(tl >= b, ramp, d)


def _target(t):
    w = np.zeros_like(t)
    s = SC["analogy"]; tl = t - s["start"]; m = (tl >= 0) & (tl < s["len"])
    w[m] = 1.6 * sstep((tl[m] - wt("analogy", 16)) / 0.8)
    s = SC["hbridge"]; tl = t - s["start"]; m = (tl >= 0) & (tl < s["len"])
    tA, tB = wt("hbridge", 19) + 0.45, wt("hbridge", 24) + 0.5
    v = 1.4 * sstep((tl - tA) / 0.6)
    v = np.where(tl >= tB, 1.4 - 2.8 * sstep((tl - tB) / 0.9), v)
    w[m] = v[m]
    s = SC["pwm"]; tl = t - s["start"]; m = (tl >= 0) & (tl < s["len"])
    w[m] = 2.4 * duty_pwm(tl[m])
    s = SC["outro"]; tl = t - s["start"]; m = (tl >= 0) & (tl < s["len"])
    w[m] = 1.0 * sstep((tl[m] - wt("outro", 6)) / 0.6)
    return w


_tgt = _target(_tt)
# inersia motor (low-pass orde 1) — kecuali saat ganti adegan (reset)
_om = np.zeros_like(_tgt)
_alpha = 1 - np.exp(-1 / (SR_CTRL * 0.22))
_starts = set(int(round(s["start"] * SR_CTRL)) for s in scenes)
for i in range(1, len(_tt)):
    _om[i] = 0.0 if i in _starts else _om[i - 1] + _alpha * (_tgt[i] - _om[i - 1])
OMEGA = _om
ANGLE = np.cumsum(OMEGA) / SR_CTRL  # putaran


def omega(t):
    return float(np.interp(t, _tt, OMEGA))


def angle(t):
    return float(np.interp(t, _tt, ANGLE))


# ---------- event visual khusus ----------
SHAKES = [  # (waktu global, intensitas px)
    (G("hook", wt("hook", 14)), 30),
    (G("hook", wt("hook", 15)), 16),
    (G("problem", wt("problem", 22)), 26),
    (G("outro", wt("outro", 10)), 8),
]
FLASHES = [  # (waktu, warna, alpha)
    (G("hook", wt("hook", 14)), (1, 0.2, 0.25), 0.55),
    (G("hook", wt("hook", 15)), (1, 1, 1), 0.35),
    (G("problem", wt("problem", 22)), (1, 0.2, 0.25), 0.45),
]


# ---------- event SFX: (waktu global, nama, gain, pan, kwargs) ----------
def sfx_events():
    ev = []
    A = ev.append
    A((0.0, "boom", 0.9, 0, {}))
    A((0.0, "whoosh", 0.5, 0, {"dur": 0.6, "up": False}))
    # hook
    A((G("hook", 0.18), "pop", 0.55, -0.4, {"f": 700}))
    A((G("hook", 0.38), "pop", 0.55, 0.4, {"f": 900}))
    A((G("hook", wt("hook", 10)), "stutter", 0.6, 0.35, {}))
    for k in range(3):
        A((G("hook", wt("hook", 10) + 0.15 + 0.14 * k), "blip", 0.35, 0.4, {"f": 1200 + 250 * k}))
    A((G("hook", wt("hook", 14) - 0.03), "zap", 0.95, -0.35, {"dur": 0.8}))
    A((G("hook", wt("hook", 15) - 0.45), "riser", 0.55, 0, {"dur": 0.45}))
    A((G("hook", wt("hook", 15)), "boom", 1.0, 0, {}))
    # transisi
    for s in scenes[1:]:
        A((s["start"] - 0.18, "whoosh", 0.55, 0, {"dur": 0.45, "up": True}))
    # problem
    A((G("problem", 0.35), "pop", 0.4, -0.3, {"f": 600}))
    A((G("problem", 0.5), "pop", 0.4, 0.3, {"f": 750}))
    t0 = wt("problem", 7) - 0.1
    for k in range(9):
        A((G("problem", t0 + 0.065 * k), "tick", 0.35, -0.35, {"f": 900 + 60 * k}))
    t0, t1 = wt("problem", 14), wt("problem", 17) + 0.6
    n = int((t1 - t0) / 0.065)
    for k in range(n):
        A((G("problem", t0 + 0.065 * k), "tick", 0.35, 0.35, {"f": 700 + 1400 * k / n}))
    A((G("problem", wt("problem", 19)), "whoosh", 0.4, 0.2, {"dur": 0.3, "up": True}))
    A((G("problem", wt("problem", 22) - 0.02), "zap", 0.85, -0.35, {"dur": 0.6}))
    A((G("problem", wt("problem", 22)), "alarm", 0.4, 0, {}))
    # analogy
    A((G("analogy", wt("analogy", 3)), "chime", 0.55, 0, {"f": 880}))
    A((G("analogy", wt("analogy", 6) - 0.2), "pop", 0.5, 0, {"f": 800}))
    A((G("analogy", wt("analogy", 8)), "data", 0.35, 0, {}))
    A((G("analogy", wt("analogy", 14)), "pop", 0.5, -0.6, {"f": 650}))
    A((G("analogy", wt("analogy", 15)), "pop", 0.5, 0.6, {"f": 950}))
    A((G("analogy", wt("analogy", 16)), "powerup", 0.6, 0, {}))
    A((G("analogy", wt("analogy", 23)), "chime", 0.5, -0.3, {"f": 1047}))
    A((G("analogy", wt("analogy", 28)), "chime", 0.5, 0.3, {"f": 1319}))
    # hbridge
    A((G("hbridge", 0.25), "pop", 0.5, 0, {"f": 700}))
    A((G("hbridge", wt("hbridge", 10)), "shimmer", 0.5, 0, {}))
    A((G("hbridge", wt("hbridge", 17)), "chime", 0.35, 0, {"f": 784}))
    tA, tB = wt("hbridge", 19), wt("hbridge", 24)
    A((G("hbridge", tA), "click", 0.7, -0.5, {}))
    A((G("hbridge", tA + 0.15), "click", 0.7, 0.5, {}))
    A((G("hbridge", tA + 0.3), "powerup", 0.45, 0, {}))
    A((G("hbridge", tB), "click", 0.6, -0.5, {}))
    A((G("hbridge", tB + 0.05), "click", 0.6, 0.5, {}))
    A((G("hbridge", tB + 0.2), "click", 0.7, 0.5, {}))
    A((G("hbridge", tB + 0.35), "click", 0.7, -0.5, {}))
    A((G("hbridge", tB + 0.4), "powerup", 0.45, 0, {}))
    # pwm
    A((G("pwm", 0.15), "pop", 0.5, 0, {"f": 650}))
    A((G("pwm", wt("pwm", 5)), "blip", 0.45, 0, {"f": 1500}))
    A((G("pwm", wt("pwm", 12)), "riser", 0.35, 0, {"dur": wt("pwm", 17) + 0.7 - wt("pwm", 12)}))
    # examples
    for i, wi in enumerate((5, 6, 8)):
        t = wt("examples", wi) - 0.15
        A((G("examples", t), "whoosh", 0.4, 0.5, {"dur": 0.3, "up": True}))
        A((G("examples", t + 0.12), "pop", 0.55, 0.2, {"f": 650 + 150 * i}))
    A((G("examples", wt("examples", 10)), "chime", 0.35, 0, {"f": 1175}))
    # outro
    A((G("outro", wt("outro", 3) - 0.15), "pop", 0.5, -0.4, {"f": 700}))
    A((G("outro", wt("outro", 5)), "chime", 0.5, -0.3, {"f": 1047}))
    A((G("outro", wt("outro", 6) - 0.15), "pop", 0.5, 0.4, {"f": 850}))
    A((G("outro", wt("outro", 9)), "chime", 0.55, 0.3, {"f": 1319}))
    A((G("outro", wt("outro", 10) - 0.9), "riser", 0.45, 0, {"dur": 0.9}))
    A((G("outro", wt("outro", 10)), "boom", 0.65, 0, {}))
    A((G("outro", wt("outro", 10) + 0.7), "click", 0.8, 0.1, {}))
    A((G("outro", wt("outro", 10) + 0.72), "pop", 0.5, 0.1, {"f": 1100}))
    A((G("outro", SC["outro"]["lead"] + SC["outro"]["vdur"] + 0.3), "chime", 0.5, 0, {"f": 1568}))
    return ev


MUSIC_MUTE = [(G("hook", wt("hook", 14)), G("hook", wt("hook", 15)))]
