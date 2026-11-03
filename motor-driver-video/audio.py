"""Sintesis musik + SFX, proses voice-over, mixing dengan sidechain ducking."""
import json, os, subprocess, sys
import numpy as np
from scipy import signal
import timeline as T

SR = 48000
rng = np.random.default_rng(7)
BUILD = T.BUILD


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (SR * tau))


def adsr(n, a=0.005, r=0.05):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], "bandpass", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "lowpass", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "highpass", fs=SR, output="sos"), x)


def sweep_phase(f):
    return 2 * np.pi * np.cumsum(f) / SR


def noise(n):
    return rng.standard_normal(n)


# ---------------- SFX ----------------
def sfx_pop(f=800):
    n = int(0.12 * SR); t = np.arange(n) / SR
    fr = f * (0.45 + 0.55 * np.exp(-t / 0.02)) * 1.0
    x = np.sin(sweep_phase(fr)) * env_exp(n, 0.035)
    x[:96] *= np.linspace(0, 1, 96)
    return x * 0.9


def sfx_blip(f=1200):
    n = int(0.09 * SR)
    x = np.sin(sweep_phase(np.full(n, f))) * env_exp(n, 0.03)
    x += 0.3 * np.sin(sweep_phase(np.full(n, f * 2))) * env_exp(n, 0.015)
    return x * adsr(n, 0.002, 0.01) * 0.6


def sfx_tick(f=1000):
    n = int(0.035 * SR)
    x = np.sign(np.sin(sweep_phase(np.full(n, f)))) * env_exp(n, 0.008)
    return lp(x, 6000) * 0.45


def sfx_click():
    n = int(0.06 * SR)
    x = hp(noise(n), 1500) * env_exp(n, 0.003) * 1.2
    x += np.sin(sweep_phase(np.full(n, 2300))) * env_exp(n, 0.006) * 0.5
    x += np.sin(sweep_phase(np.full(n, 160))) * env_exp(n, 0.012) * 0.6
    return x * 0.8


def sfx_whoosh(dur=0.5, up=True):
    n = int(dur * SR)
    x = noise(n)
    f, tt, Z = signal.stft(x, SR, nperseg=1024)
    prog = np.linspace(0, 1, Z.shape[1])
    fc = (300 * (12 ** prog)) if up else (3600 * (12 ** -prog))
    mask = np.exp(-((np.log(f[:, None] + 1) - np.log(fc[None, :])) ** 2) / 0.35)
    _, y = signal.istft(Z * mask, SR, nperseg=1024)
    y = y[:n]
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.6
    return y / (np.abs(y).max() + 1e-9) * e * 0.8


def sfx_boom():
    n = int(1.6 * SR); t = np.arange(n) / SR
    sub = np.sin(sweep_phase(30 + 70 * np.exp(-t / 0.08))) * env_exp(n, 0.45)
    hit = lp(noise(n), 900) * env_exp(n, 0.05) * 0.8
    click = hp(noise(n), 3000) * env_exp(n, 0.004) * 0.4
    x = sub * 1.1 + hit + click
    return np.tanh(x * 1.5) * 0.8


def sfx_riser(dur=1.0):
    n = int(dur * SR); t = np.linspace(0, 1, n)
    x = sfx_whoosh_raw(n, 400, 7000) * 0.6
    x += 0.25 * np.sin(sweep_phase(250 * 6 ** t))
    return x * t ** 2.2


def sfx_whoosh_raw(n, f0, f1):
    x = noise(n)
    f, tt, Z = signal.stft(x, SR, nperseg=1024)
    fc = f0 * (f1 / f0) ** np.linspace(0, 1, Z.shape[1])
    mask = np.exp(-((np.log(f[:, None] + 1) - np.log(fc[None, :])) ** 2) / 0.25)
    _, y = signal.istft(Z * mask, SR, nperseg=1024)
    y = y[:n]
    return y / (np.abs(y).max() + 1e-9)


def sfx_zap(dur=0.7):
    n = int(dur * SR); t = np.arange(n) / SR
    fm = 90 + 900 * np.abs(lp(noise(n), 40)) * 3
    saw = signal.sawtooth(sweep_phase(fm))
    crackle = (rng.random(n) < 0.004).astype(float) * rng.choice([-1, 1], n)
    crackle = signal.lfilter([1], [1, -0.85], crackle) * 1.5
    x = saw * 0.6 + hp(noise(n), 2500) * 0.5 + crackle
    gate = (lp(noise(n), 30) > -0.02).astype(float) * 0.7 + 0.3
    x = np.tanh(2.5 * x) * gate * env_exp(n, dur / 3)
    x[: int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))
    return x * 0.7


def sfx_stutter():
    n = int(0.75 * SR); t = np.arange(n) / SR
    buzz = signal.sawtooth(sweep_phase(np.full(n, 95))) * 0.6 + hp(noise(n), 2000) * 0.15
    gate = (np.sin(2 * np.pi * 9 * t) > 0.2).astype(float)
    gate = lp(gate, 200)
    return lp(buzz, 2500) * gate * env_exp(n, 0.5) * 0.6


def sfx_alarm():
    n = int(0.9 * SR); t = np.arange(n) / SR
    f = np.where((t * 5).astype(int) % 2 == 0, 880, 660)
    x = signal.square(sweep_phase(f)) * 0.3
    return lp(x, 4000) * adsr(n, 0.005, 0.1)


def sfx_chime(f=1047):
    n = int(1.6 * SR)
    x = np.zeros(n)
    for ratio, amp, tau in ((1, 1, 0.6), (2.0, 0.35, 0.35), (3.0, 0.15, 0.2), (1.5, 0.4, 0.5)):
        x += amp * np.sin(sweep_phase(np.full(n, f * ratio))) * env_exp(n, tau)
    x[:120] *= np.linspace(0, 1, 120)
    return x * 0.35


def sfx_data():
    out = []
    for k in range(10):
        f = rng.choice([1400, 1800, 2200, 2600])
        b = sfx_blip(f)[: int(0.045 * SR)] * 0.6
        out += [b, np.zeros(int(0.015 * SR))]
    return np.concatenate(out)


def sfx_powerup():
    n = int(0.9 * SR); t = np.linspace(0, 1, n)
    x = np.sin(sweep_phase(120 * 7 ** t)) * 0.5
    x += signal.sawtooth(sweep_phase(60 * 4 ** t)) * 0.2
    x += hp(noise(n), 4000) * 0.1 * t
    x = lp(x, 5000)
    return x * np.sin(np.pi * t) ** 0.6 * 0.7


def sfx_shimmer():
    n = int(1.2 * SR); x = np.zeros(n)
    notes = [1047, 1319, 1568, 2093, 2637]
    for i, f in enumerate(notes):
        o = int(i * 0.07 * SR)
        s = sfx_chime(f)[: n - o] * 0.5
        x[o:] += s
    return x


SFX = dict(pop=sfx_pop, blip=sfx_blip, tick=sfx_tick, click=sfx_click, whoosh=sfx_whoosh,
           boom=sfx_boom, riser=sfx_riser, zap=sfx_zap, stutter=sfx_stutter, alarm=sfx_alarm,
           chime=sfx_chime, data=sfx_data, powerup=sfx_powerup, shimmer=sfx_shimmer)


# ---------------- Reverb ----------------
def make_ir(sec=1.8):
    n = int(sec * SR)
    ir = np.stack([lp(noise(n), 6000), lp(noise(n), 6000)]) * env_exp(n, sec / 6.5)
    ir[:, : int(0.01 * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True))


IR = make_ir()


def reverb(x):  # mono -> stereo
    return np.stack([signal.fftconvolve(x, IR[0])[: len(x)], signal.fftconvolve(x, IR[1])[: len(x)]])


def pan2(x, p):
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)])


# ---------------- Musik ----------------
def note_hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def music(N):
    bpm = 112
    beat = 60 / bpm
    bar = beat * 4
    L = np.zeros(N); R = np.zeros(N)
    drums = np.zeros(N); bass = np.zeros(N); pad = np.zeros(N); pluck = np.zeros(N)
    duck = np.ones(N)
    # Am  F  C  G
    chords = [[57, 60, 64], [53, 57, 60], [48, 55, 60], [55, 59, 62]]
    roots = [45, 41, 48, 43]
    total = N / SR
    nb = int(total / beat) + 1

    def add(buf, x, t):
        i = int(t * SR)
        if i >= N: return
        m = min(len(x), N - i)
        buf[i:i + m] += x[:m]

    kn = int(0.4 * SR); kt = np.arange(kn) / SR
    kick = np.sin(sweep_phase(45 + 110 * np.exp(-kt / 0.035))) * env_exp(kn, 0.16)
    kick = np.tanh(kick * 1.6) * 0.9
    sn = int(0.25 * SR)
    clap = bp(noise(sn), 900, 5000) * env_exp(sn, 0.06) * 0.6
    hn = int(0.06 * SR)
    hat = hp(noise(hn), 7000) * env_exp(hn, 0.015) * 0.25
    pump = 1 - 0.55 * env_exp(int(beat * SR), 0.12)

    for b in range(nb):
        t = b * beat
        bi = (b // 4) % 4
        intro = t < 0.0
        add(drums, kick, t)
        di = int(t * SR); m = min(len(pump), N - di)
        if m > 0: duck[di:di + m] = np.minimum(duck[di:di + m], pump[:m])
        if b % 2 == 1: add(drums, clap, t)
        add(drums, hat * 0.6, t)
        add(drums, hat * (1.0 if b % 2 else 0.8), t + beat / 2)
        if b % 4 == 3: add(drums, hat * 0.5, t + beat * 0.75)
        # bass: 8th pump
        for k in range(2):
            ln = int(beat / 2 * SR * 0.9); tt = np.arange(ln) / SR
            f = note_hz(roots[bi] - 12 + (12 if (k == 1 and b % 2) else 0))
            x = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(4 * np.pi * f * tt) + 0.15 * np.sin(6 * np.pi * f * tt)
            add(bass, x * adsr(ln, 0.004, 0.03) * 0.45, t + k * beat / 2)
        # pluck arp (16th feel on 8th)
        for k in range(2):
            ln = int(0.3 * SR); tt = np.arange(ln) / SR
            nt = chords[bi][(b * 2 + k) % 3] + 12
            f = note_hz(nt)
            x = signal.sawtooth(2 * np.pi * f * tt) * 0.5 + np.sin(2 * np.pi * f * tt)
            x = lp(x, 2500) * env_exp(ln, 0.09)
            add(pluck, x * 0.12, t + k * beat / 2)
    # pad per bar
    nbar = int(total / bar) + 1
    for k in range(nbar):
        t = k * bar
        ln = int(bar * SR) + int(0.3 * SR); tt = np.arange(ln) / SR
        x = np.zeros(ln)
        for m in chords[k % 4]:
            for det in (-0.12, 0.12):
                f = note_hz(m) * 2 ** (det / 12)
                x += signal.sawtooth(2 * np.pi * f * tt + rng.random() * 6)
        x = lp(x, 1400) * adsr(ln, 0.25, 0.4) * 0.05
        add(pad, x, t)
    mel = drums * 1.0 + bass * duck + pad * duck + pluck * (0.6 + 0.4 * duck)
    wet = reverb(pad * duck * 0.8 + pluck * 0.7)
    st = np.stack([mel, mel]) + wet * 0.35
    # stereo width hat/pluck sedikit
    st[0] += pluck * 0.15; st[1] -= pluck * 0.05
    return st


# ---------------- Motor ----------------
def motor_sound(N):
    t_s = np.arange(N) / SR
    om = np.abs(np.interp(t_s, np.arange(len(T.OMEGA)) / T.SR_CTRL, T.OMEGA))
    f0 = 55 + 75 * om
    ph = sweep_phase(f0)
    x = (np.sin(ph) + 0.55 * np.sin(2 * ph) + 0.35 * np.sin(3 * ph) + 0.25 * np.sin(6 * ph)
         + 0.08 * np.sin(12 * ph))
    brush = bp(noise(N), 2500, 7000) * (np.abs(np.sin(3 * ph)) ** 4) * 0.5
    amp = np.clip(om / 1.2, 0, 1) ** 0.8
    # PWM whine di adegan pwm
    s = T.SC["pwm"]
    tl = t_s - s["start"]
    inpwm = ((tl >= 0) & (tl < s["len"])).astype(float)
    d = T.duty_pwm(np.clip(tl, 0, None)) * inpwm
    whine = signal.square(2 * np.pi * 1100 * t_s, duty=np.clip(d, 0.05, 0.95)) * (d > 0) * 0.05
    whine = lp(whine, 5000)
    fade = np.ones(N)
    for sc in T.scenes:  # potong halus di akhir adegan
        e = int((sc["start"] + sc["len"]) * SR)
        a = max(0, e - int(0.15 * SR))
        fade[a:e] = np.minimum(fade[a:e], np.linspace(1, 0, e - a))
    return (lp(x, 3000) * 0.32 + brush) * amp * fade + whine * fade


# ---------------- Voice ----------------
def voice(N):
    v = np.zeros(N)
    for s in T.scenes:
        wav = f"{BUILD}/{s['key']}_proc.wav"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", f"{BUILD}/{s['key']}.mp3", "-af",
                        "highpass=f=75,equalizer=f=220:t=q:w=1:g=1.5,equalizer=f=3200:t=q:w=1.2:g=3,"
                        "equalizer=f=9000:t=h:w=1:g=2,"
                        "acompressor=threshold=-20dB:ratio=3.5:attack=4:release=90:makeup=4dB",
                        "-ar", str(SR), "-ac", "1", "-f", "f32le", wav], check=True)
        x = np.fromfile(wav, dtype=np.float32).astype(float)
        i = int((s["start"] + s["lead"]) * SR)
        m = min(len(x), N - i)
        v[i:i + m] += x[:m]
    return v / (np.abs(v).max() + 1e-9) * 0.89


def main(out):
    N = int((T.TOTAL + 0.5) * SR)
    vo = voice(N)
    # sidechain envelope dari voice
    env = np.abs(vo)
    env = signal.lfilter([1 - np.exp(-1 / (SR * 0.12))], [1, -np.exp(-1 / (SR * 0.12))], env)
    env = np.convolve(env, np.ones(int(0.05 * SR)) / int(0.05 * SR), mode="same")
    duckv = 1 - 0.55 * np.clip(env / 0.08, 0, 1)

    mus = music(N) * 0.21
    # mute momen dramatis + fade akhir
    g = np.ones(N)
    for a, b in T.MUSIC_MUTE:
        ia, ib = int(a * SR), int(b * SR)
        g[ia:ib] = 0.0
        g[ia - 300:ia] *= np.linspace(1, 0, 300)
    end = int(T.TOTAL * SR)
    fl = int(2.2 * SR)
    g[end - fl:end] *= np.linspace(1, 0, fl) ** 1.5
    g[end:] = 0
    # intro: musik masuk sedikit sebelum
    mus *= g * duckv

    fx = np.zeros((2, N))
    fxwet = np.zeros(N)
    for t, name, gain, p, kw in T.sfx_events():
        x = SFX[name](**kw) * gain
        i = int(max(t, 0) * SR)
        m = min(len(x), N - i)
        if m <= 0: continue
        fx[:, i:i + m] += pan2(x[:m], p)
        if name in ("chime", "boom", "zap", "shimmer", "pop", "click"):
            fxwet[i:i + m] += x[:m] * (0.5 if name in ("chime", "shimmer") else 0.2)
    fx += reverb(fxwet) * 0.35

    mot = motor_sound(N)
    mix = mus + fx * 0.75 + pan2(mot, 0.0) * 0.36 + np.stack([vo, vo])
    # bus: soft clip ringan
    mix = np.tanh(mix * 0.7)
    mix = mix[:, : int(T.TOTAL * SR)]
    raw = out + ".raw.wav"
    from scipy.io import wavfile
    wavfile.write(raw, SR, (mix.T / max(1.0, np.abs(mix).max())).astype(np.float32))
    # loudnorm 2-pass ke -14 LUFS (standar TikTok/IG)
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", raw, "-af",
                        "loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    js = json.loads(r.stderr[r.stderr.rfind("{"):])
    af = ("loudnorm=I=-14:TP=-1.2:LRA=11:linear=true:"
          f"measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
          f"measured_thresh={js['input_thresh']}:offset={js['target_offset']},"
          "alimiter=limit=0.84:attack=2:release=60:level=false")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", raw, "-af", af, "-ar", str(SR), out], check=True)
    os.remove(raw)
    print("audio ok", out, js["input_i"], "LUFS ->", -14)


if __name__ == "__main__":
    main(sys.argv[1])
