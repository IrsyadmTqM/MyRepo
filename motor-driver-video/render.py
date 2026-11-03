"""Render visual video 1080x1920 dengan Cairo, frame dikirim ke ffmpeg."""
import math, os, subprocess, sys
from multiprocessing import Pool
import cairo
import numpy as np
import timeline as T
from timeline import W, H, FPS, wt

# ---------- warna ----------
CYAN = (0.13, 0.83, 0.93); YEL = (0.99, 0.82, 0.1); RED = (0.97, 0.26, 0.38)
GREEN = (0.3, 0.9, 0.52); ORANGE = (0.99, 0.58, 0.22); PURPLE = (0.66, 0.55, 0.98)
PINK = (0.98, 0.42, 0.72); WHITE = (1, 1, 1); GREY = (0.62, 0.67, 0.78); DARK = (0.05, 0.07, 0.14)
FONT = "Inter Display Black"; FONT_B = "Inter Display ExtraBold"; FONT_M = "Inter SemiBold"


# ---------- easing ----------
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def prog(t, a, d): return clamp((t - a) / d) if d > 0 else float(t >= a)
def eo(x): x = clamp(x); return 1 - (1 - x) ** 3
def eback(x, s=1.9):
    x = clamp(x); x -= 1
    return x * x * ((s + 1) * x + s) + 1
def pop(t, a, d=0.38): return eback(prog(t, a, d)) if t >= a else 0.0


# ---------- primitif ----------
def rrect(c, x, y, w, h, r):
    r = min(r, w / 2, h / 2)
    c.new_sub_path()
    c.arc(x + w - r, y + r, r, -math.pi / 2, 0)
    c.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    c.arc(x + r, y + h - r, r, math.pi / 2, math.pi)
    c.arc(x + r, y + r, r, math.pi, 1.5 * math.pi)
    c.close_path()


def rgba(c, col, a=1.0):
    c.set_source_rgba(col[0], col[1], col[2], a)


def text(c, s, x, y, size, col=WHITE, face=FONT, align="c", a=1.0, stroke=0, scol=(0, 0, 0), sa=0.85):
    c.select_font_face(face, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL)
    c.set_font_size(size)
    e = c.text_extents(s)
    fx = c.font_extents()
    tx = x - (e.x_advance / 2 if align == "c" else (e.x_advance if align == "r" else 0))
    ty = y + (fx[0] - fx[1]) / 2  # pusat vertikal berdasar ascent/descent
    c.move_to(tx, ty)
    c.text_path(s)
    if stroke:
        c.set_line_width(stroke); c.set_line_join(cairo.LINE_JOIN_ROUND)
        rgba(c, scol, sa * a); c.stroke_preserve()
    rgba(c, col, a); c.fill()
    return e.x_advance


def text_w(c, s, size, face=FONT):
    c.select_font_face(face, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL)
    c.set_font_size(size)
    return c.text_extents(s).x_advance


def glow_circle(c, x, y, r, col, a):
    g = cairo.RadialGradient(x, y, 0, x, y, r)
    g.add_color_stop_rgba(0, col[0], col[1], col[2], a)
    g.add_color_stop_rgba(1, col[0], col[1], col[2], 0)
    c.set_source(g); c.arc(x, y, r, 0, 2 * math.pi); c.fill()


def scaled(c, cx, cy, s, fn):
    if s <= 0.001: return
    c.save(); c.translate(cx, cy); c.scale(s, s); c.translate(-cx, -cy); fn(); c.restore()


def wire(c, pts, width, col, t, flow=True, a=1.0, speed=140, dash=(18, 26), reverse=False):
    if a <= 0: return
    c.save()
    c.set_line_cap(cairo.LINE_CAP_ROUND); c.set_line_join(cairo.LINE_JOIN_ROUND)
    def path():
        c.move_to(*pts[0])
        for p in pts[1:]: c.line_to(*p)
    path(); c.set_line_width(width + 14); rgba(c, col, 0.10 * a); c.stroke()
    path(); c.set_line_width(width); rgba(c, col, 0.38 * a); c.stroke()
    if flow:
        path(); c.set_line_width(width * 0.75)
        c.set_dash(dash, (t * speed) if reverse else (-t * speed))
        rgba(c, WHITE, 0.55 * a); c.stroke_preserve()
        c.set_line_width(width * 0.55); rgba(c, col, a); c.stroke()
    c.restore()


# ---------- komponen ----------
def arduino(c, cx, cy, s=1.0, dead=0.0, t=0.0):
    w, h = 380 * s, 260 * s
    x, y = cx - w / 2, cy - h / 2
    glow_circle(c, cx, cy, w * 0.75, (0.0, 0.55, 0.65), 0.18)
    rrect(c, x, y, w, h, 22 * s); rgba(c, (0.0, 0.47, 0.58)); c.fill_preserve()
    c.set_line_width(4 * s); rgba(c, (0.35, 0.85, 0.92)); c.stroke()
    # header pin atas & bawah
    for row, yy in ((0, y + 18 * s), (1, y + h - 34 * s)):
        rrect(c, x + 70 * s, yy, w - 100 * s, 16 * s, 3 * s); rgba(c, (0.08, 0.08, 0.1)); c.fill()
        for k in range(14 if row == 0 else 10):
            px = x + 78 * s + k * ((w - 116 * s) / (13 if row == 0 else 9))
            c.rectangle(px - 3 * s, yy + 5 * s, 6 * s, 6 * s); rgba(c, (0.85, 0.7, 0.3)); c.fill()
    # USB & jack
    c.rectangle(x - 16 * s, y + 50 * s, 70 * s, 56 * s); rgba(c, (0.78, 0.8, 0.84)); c.fill()
    c.rectangle(x - 10 * s, y + 150 * s, 56 * s, 50 * s); rgba(c, (0.1, 0.1, 0.12)); c.fill()
    # chip
    rrect(c, cx - 30 * s, cy - 18 * s, 170 * s, 54 * s, 4 * s); rgba(c, (0.1, 0.1, 0.13)); c.fill()
    for k in range(10):
        for side in (-1, 1):
            c.rectangle(cx - 22 * s + k * 16 * s, cy + 9 * s + side * 34 * s - 3 * s, 7 * s, 8 * s)
            rgba(c, (0.75, 0.75, 0.78)); c.fill()
    text(c, "ARDUINO", cx - 60 * s, cy - 58 * s, 34 * s, WHITE, FONT, "c")
    # LED
    on = 1.0 if dead < 0.5 else 0.0
    glow_circle(c, x + 90 * s, cy + 40 * s, 22 * s, GREEN, 0.7 * on)
    c.arc(x + 90 * s, cy + 40 * s, 6 * s, 0, 2 * math.pi); rgba(c, GREEN if on else (0.2, 0.25, 0.2)); c.fill()
    if dead > 0:
        rrect(c, x, y, w, h, 22 * s); rgba(c, (0.08, 0.02, 0.04), 0.6 * dead); c.fill()
        c.set_line_width(22 * s); c.set_line_cap(cairo.LINE_CAP_ROUND)
        k = eback(dead)
        d = 90 * s * k
        rgba(c, RED, dead)
        c.move_to(cx - d, cy - d); c.line_to(cx + d, cy + d); c.stroke()
        c.move_to(cx + d, cy - d); c.line_to(cx - d, cy + d); c.stroke()


def motor(c, cx, cy, r, ang, om=0.0, accent=ORANGE):
    glow_circle(c, cx, cy, r * 1.7, accent, 0.10 + 0.15 * min(abs(om), 2) / 2)
    # terminal
    for sx in (-1, 1):
        rrect(c, cx + sx * r * 0.35 - r * 0.09, cy - r * 1.18, r * 0.18, r * 0.3, 4)
        rgba(c, (0.85, 0.7, 0.35)); c.fill()
    g = cairo.RadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r * 1.05)
    g.add_color_stop_rgb(0, 0.86, 0.88, 0.92); g.add_color_stop_rgb(1, 0.42, 0.45, 0.52)
    c.set_source(g); c.arc(cx, cy, r, 0, 2 * math.pi); c.fill()
    c.arc(cx, cy, r * 0.8, 0, 2 * math.pi); rgba(c, (0.16, 0.18, 0.24)); c.fill()
    # rotor + motion blur
    a0 = ang * 2 * math.pi
    blur = min(abs(om) * 0.18, 0.5)
    ghosts = [(0, 1.0)] + ([(-blur * k / 3 * math.copysign(1, om), 0.35 / k) for k in (1, 2, 3)] if blur > 0.02 else [])
    for off, al in ghosts:
        for k in range(3):
            th = a0 + off + k * 2 * math.pi / 3
            c.save(); c.translate(cx, cy); c.rotate(th)
            c.move_to(0, -r * 0.12); c.line_to(r * 0.72, -r * 0.2); c.arc(r * 0.72, 0, r * 0.2, -math.pi / 2, math.pi / 2)
            c.line_to(0, r * 0.12); c.close_path()
            rgba(c, accent, al); c.fill(); c.restore()
    c.arc(cx, cy, r * 0.2, 0, 2 * math.pi); rgba(c, (0.85, 0.87, 0.9)); c.fill()
    c.arc(cx, cy, r * 0.08, 0, 2 * math.pi); rgba(c, (0.3, 0.32, 0.38)); c.fill()
    c.arc(cx, cy, r, 0, 2 * math.pi); c.set_line_width(5); rgba(c, (0.95, 0.96, 1), 0.7); c.stroke()


def spin_arrow(c, cx, cy, r, direction, col, a, t):
    if a <= 0: return
    c.save(); c.translate(cx, cy); c.rotate(direction * t * 3)
    c.set_line_width(12); c.set_line_cap(cairo.LINE_CAP_ROUND); rgba(c, col, a)
    for k in range(2):
        st = k * math.pi
        c.new_path()
        if direction > 0:
            c.arc(0, 0, r, st, st + 1.9); c.stroke()
            ex, ey = r * math.cos(st + 1.9), r * math.sin(st + 1.9); tang = st + 1.9 + math.pi / 2
        else:
            c.arc_negative(0, 0, r, st, st - 1.9); c.stroke()
            ex, ey = r * math.cos(st - 1.9), r * math.sin(st - 1.9); tang = st - 1.9 - math.pi / 2
        c.save(); c.translate(ex, ey); c.rotate(tang)
        c.move_to(16, 0); c.line_to(-14, -18); c.line_to(-14, 18); c.close_path(); c.fill(); c.restore()
    c.restore()


def driver(c, cx, cy, s=1.0, t=0.0, active=0.0):
    w, h = 340 * s, 230 * s
    x, y = cx - w / 2, cy - h / 2
    glow_circle(c, cx, cy, w * 0.8, RED, 0.16 + 0.2 * active * (0.7 + 0.3 * math.sin(t * 12)))
    rrect(c, x, y, w, h, 20 * s); rgba(c, (0.78, 0.12, 0.2)); c.fill_preserve()
    c.set_line_width(4 * s); rgba(c, (1, 0.55, 0.6)); c.stroke()
    # heatsink
    hx, hy, hw, hh = cx - 70 * s, y + 16 * s, 140 * s, 96 * s
    rrect(c, hx, hy, hw, hh, 6 * s); rgba(c, (0.12, 0.12, 0.14)); c.fill()
    for k in range(8):
        c.rectangle(hx + 8 * s + k * 16.5 * s, hy + 6 * s, 7 * s, hh - 12 * s); rgba(c, (0.32, 0.33, 0.36)); c.fill()
    # terminal biru
    for sx in (x + 10 * s, x + w - 60 * s):
        rrect(c, sx, cy - 20 * s, 50 * s, 70 * s, 5 * s); rgba(c, (0.15, 0.4, 0.9)); c.fill()
        for k in range(2):
            c.arc(sx + 25 * s, cy - 2 * s + k * 34 * s, 9 * s, 0, 2 * math.pi); rgba(c, (0.75, 0.78, 0.82)); c.fill()
    text(c, "MOTOR DRIVER", cx, y + h - 40 * s, 32 * s, WHITE, FONT)


def battery(c, cx, cy, s=1.0, t=0.0):
    w, h = 130 * s, 230 * s
    x, y = cx - w / 2, cy - h / 2
    glow_circle(c, cx, cy, h * 0.6, GREEN, 0.15)
    rrect(c, cx - 26 * s, y - 20 * s, 52 * s, 26 * s, 6 * s); rgba(c, (0.8, 0.82, 0.85)); c.fill()
    rrect(c, x, y, w, h, 18 * s); rgba(c, (0.12, 0.14, 0.2)); c.fill_preserve()
    c.set_line_width(5 * s); rgba(c, (0.8, 0.82, 0.85)); c.stroke()
    lvl = 0.82
    rrect(c, x + 12 * s, y + 12 * s + (h - 24 * s) * (1 - lvl), w - 24 * s, (h - 24 * s) * lvl, 10 * s)
    rgba(c, GREEN); c.fill()
    text(c, "+", cx, y + 52 * s, 56 * s, (0.05, 0.25, 0.1), FONT)
    text(c, "12V", cx, cy + 40 * s, 40 * s, (0.05, 0.25, 0.1), FONT)


def spark(c, cx, cy, dt, seed=1, scale=1.0):
    if dt < 0 or dt > 1.4: return
    r = np.random.default_rng(seed)
    a = math.exp(-dt * 4)
    glow_circle(c, cx, cy, 260 * scale * (0.6 + dt), YEL, 0.55 * a)
    glow_circle(c, cx, cy, 120 * scale, WHITE, 0.8 * math.exp(-dt * 8))
    c.set_line_cap(cairo.LINE_CAP_ROUND); c.set_line_join(cairo.LINE_JOIN_ROUND)
    if dt < 0.45:
        r2 = np.random.default_rng(seed * 100 + int(dt * 30))
        for k in range(9):
            th = r2.uniform(0, 2 * math.pi); L = r2.uniform(120, 260) * scale
            c.move_to(cx, cy)
            for j in range(1, 6):
                d = L * j / 5
                c.line_to(cx + d * math.cos(th) + r2.uniform(-25, 25), cy + d * math.sin(th) + r2.uniform(-25, 25))
            c.set_line_width(8 * scale); rgba(c, YEL, 0.9 * a); c.stroke_preserve()
            c.set_line_width(3 * scale); rgba(c, WHITE, a); c.stroke()
    for k in range(26):
        th = r.uniform(0, 2 * math.pi); v = r.uniform(300, 900) * scale
        px = cx + math.cos(th) * v * dt; py = cy + math.sin(th) * v * dt + 900 * dt * dt
        c.arc(px, py, max(1.5, 7 * scale * (1 - dt / 1.4)), 0, 2 * math.pi)
        rgba(c, (1, 0.85 - 0.4 * dt, 0.3), clamp(1 - dt / 1.2)); c.fill()


def smoke(c, cx, cy, dt, seed=3):
    if dt < 0: return
    r = np.random.default_rng(seed)
    for k in range(10):
        st = k * 0.18
        d = dt - st
        if d < 0 or d > 2.2: continue
        x = cx + r.uniform(-60, 60) + 30 * math.sin(d * 2 + k)
        y = cy - d * 160
        rad = 30 + d * 50
        glow_circle(c, x, y, rad, (0.55, 0.55, 0.6), 0.45 * (1 - d / 2.2))


def warning(c, cx, cy, s, a=1.0):
    if s <= 0: return
    c.save(); c.translate(cx, cy); c.scale(s, s)
    c.set_line_join(cairo.LINE_JOIN_ROUND)
    c.move_to(0, -95); c.line_to(105, 80); c.line_to(-105, 80); c.close_path()
    c.set_line_width(22); rgba(c, YEL, a); c.stroke_preserve(); c.fill()
    text(c, "!", 0, 22, 120, (0.1, 0.08, 0.02), FONT, a=a)
    c.restore()


def pill(c, cx, cy, label, col, s=1.0, size=44, fg=(0.05, 0.05, 0.1)):
    if s <= 0: return
    def f():
        w = text_w(c, label, size) + 60
        rrect(c, cx - w / 2, cy - size * 0.85, w, size * 1.7, size * 0.85); rgba(c, col); c.fill()
        text(c, label, cx, cy, size, fg, FONT)
    scaled(c, cx, cy, s, f)


# ---------- background, HUD, caption ----------
def background(c, t):
    g = cairo.LinearGradient(0, 0, 0, H)
    g.add_color_stop_rgb(0, 0.035, 0.05, 0.12); g.add_color_stop_rgb(1, 0.06, 0.04, 0.14)
    c.set_source(g); c.paint()
    glow_circle(c, 200 + 120 * math.sin(t * 0.3), 600 + 80 * math.cos(t * 0.23), 700, (0.1, 0.5, 0.8), 0.16)
    glow_circle(c, 900 + 100 * math.cos(t * 0.27), 1350 + 120 * math.sin(t * 0.19), 760, (0.5, 0.2, 0.8), 0.15)
    off = (t * 18) % 60
    c.set_line_width(1.2); rgba(c, (0.5, 0.7, 1), 0.06)
    for x in range(0, W + 60, 60):
        c.move_to(x, 0); c.line_to(x, H)
    yv = -60 + off
    while yv < H:
        c.move_to(0, yv); c.line_to(W, yv); yv += 60
    c.stroke()
    # partikel
    r = np.random.default_rng(11)
    for k in range(40):
        x0, y0, sp, sz = r.uniform(0, W), r.uniform(0, H), r.uniform(10, 40), r.uniform(1.5, 4)
        y = (y0 - t * sp) % H
        c.arc(x0 + 10 * math.sin(t + k), y, sz, 0, 2 * math.pi); rgba(c, (0.6, 0.85, 1), 0.25); c.fill()


def vignette(c):
    g = cairo.RadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75)
    g.add_color_stop_rgba(0, 0, 0, 0, 0); g.add_color_stop_rgba(1, 0, 0, 0, 0.55)
    c.set_source(g); c.paint()


def hud(c, t, sc):
    n = len(T.scenes)
    x0, x1, y = 60, W - 60, 120
    seg = (x1 - x0 - 10 * (n - 1)) / n
    for i, s in enumerate(T.scenes):
        f = clamp((t - s["start"]) / s["len"])
        xs = x0 + i * (seg + 10)
        rrect(c, xs, y, seg, 8, 4); rgba(c, WHITE, 0.18); c.fill()
        if f > 0:
            rrect(c, xs, y, seg * f, 8, 4); rgba(c, YEL); c.fill()


def title(c, tl, sc):
    lines = T.TITLES[sc["key"]]
    for i, ln in enumerate(lines):
        p = eo(prog(tl, 0.05 + i * 0.1, 0.4))
        a = p
        y = 250 + i * 92 - 40 * (1 - p)
        col = WHITE if i == 0 else YEL
        if len(lines) == 1: col = YEL
        text(c, ln, W / 2, y, 82 if i == 0 else 92, col, FONT, a=a, stroke=10, sa=0.6)
    # nomor
    p = eo(prog(tl, 0.0, 0.3))
    pill(c, W / 2, 175, f"{sc['idx'] + 1:02d} / {len(T.scenes):02d}", CYAN, p * 0.75, 30)


def chunks(sc):
    """Pecah per frasa (tanda baca), lalu bagi rata maks 3 kata / ~18 huruf."""
    phrases, cur = [], []
    for w in sc["words"]:
        cur.append(w)
        if w["p"]:
            phrases.append(cur); cur = []
    if cur: phrases.append(cur)
    out = []
    for ph in phrases:
        n = len(ph)
        k = max(math.ceil(n / 3), math.ceil(sum(len(x["w"]) + 1 for x in ph) / 19))
        k = min(k, n)
        base, extra = divmod(n, k)
        i = 0
        for j in range(k):
            m = base + (1 if j < extra else 0)
            out.append(ph[i:i + m]); i += m
    return out


CHUNKS = {s["key"]: chunks(s) for s in T.scenes}


def captions(c, tl, sc):
    ch = CHUNKS[sc["key"]]
    end_voice = sc["lead"] + sc["vdur"] + 0.25
    for k, cw in enumerate(ch):
        a = cw[0]["s"] - 0.06
        b = ch[k + 1][0]["s"] - 0.06 if k + 1 < len(ch) else end_voice
        if not (a <= tl < b): continue
        p = pop(tl, a, 0.18)
        size = 78
        words = [w["w"].upper() for w in cw]
        while True:
            total = sum(text_w(c, s, size) for s in words) + 22 * (len(words) - 1)
            if total < 960 or size < 50: break
            size -= 4
        def f():
            x = W / 2 - total / 2
            cy = 1480
            for w, s in zip(cw, words):
                active = w["s"] - 0.04 <= tl < (w["e"] + 0.15)
                ww = text_w(c, s, size)
                if active:
                    rrect(c, x - 12, cy - size * 0.62, ww + 24, size * 1.24, 16); rgba(c, (0, 0, 0), 0.35); c.fill()
                text(c, s, x, cy, size, YEL if active else WHITE, FONT, "l", stroke=14, sa=0.9)
                x += ww + 22
        scaled(c, W / 2, 1480, 0.8 + 0.2 * p, f)


# ---------- adegan ----------
def sc_hook(c, tl, t, sc):
    k = "hook"
    tz = wt(k, 14)
    dead = eo(prog(tl, tz + 0.15, 0.3))
    wire_a = eo(prog(tl, 0.5, 0.4))
    # kabel langsung
    for dy, col in ((-22, RED), (22, (0.75, 0.78, 0.85))):
        wire(c, [(440, 840 + dy), (560, 840 + dy), (600, 860 + dy * 0.6), (680, 860 + dy * 0.6)], 10, col, t,
             flow=False, a=wire_a * (1 - 0.6 * dead))
    scaled(c, 290, 840, pop(tl, 0.15), lambda: arduino(c, 290, 840, 0.78, dead, t))
    # motor bergetar mencoba muter
    tm = wt(k, 9)
    jit = 0.0
    if tm < tl < tm + 1.2:
        jit = 0.025 * math.sin((tl - tm) * 55) * math.exp(-(tl - tm) * 1.5)
    sh = 6 * math.sin(tl * 90) * (1 if tm < tl < tm + 0.9 else 0)
    scaled(c, 820, 860, pop(tl, 0.35), lambda: motor(c, 820 + sh, 860, 125, jit, 0, ORANGE))
    # tanda tanya
    tq = wt(k, 10)
    for i in range(3):
        s = pop(tl, tq + 0.15 + 0.14 * i, 0.35) * (1 - eo(prog(tl, tz - 0.2, 0.2)))
        if s > 0:
            x, y = 740 + i * 80, 640 - (i % 2) * 40 + 8 * math.sin(tl * 5 + i)
            scaled(c, x, y, s, lambda x=x, y=y: text(c, "?", x, y, 96, YEL, FONT, stroke=10))
    # zap
    smoke(c, 290, 760, tl - tz - 0.3)
    spark(c, 330, 820, tl - tz, seed=5)
    # slam MOTOR DRIVER
    ts = wt(k, 15)
    if tl >= ts:
        p = eo(prog(tl, ts, 0.22))
        s = 2.2 - 1.2 * p
        def f():
            rrect(c, 120, 1120, 840, 190, 30); rgba(c, YEL, 0.95 * p); c.fill()
            text(c, "MOTOR DRIVER", W / 2, 1215, 104, DARK, FONT, a=p)
        scaled(c, W / 2, 1215, s, f)
        pill(c, W / 2, 1010, "JAWABANNYA:", WHITE, pop(tl, ts + 0.15), 38)


def sc_problem(c, tl, t, sc):
    k = "problem"
    base, top = 1290, 620
    full = base - top
    xs = (320, 760)
    for i, x in enumerate(xs):
        s = pop(tl, 0.35 + 0.15 * i)
        def f(x=x):
            rrect(c, x - 110, top, 220, full, 26); rgba(c, WHITE, 0.07); c.fill()
            c.set_line_width(3); rrect(c, x - 110, top, 220, full, 26); rgba(c, WHITE, 0.15); c.stroke()
        scaled(c, x, base, s, f)
    # bar 1: 20 mA
    t1 = wt(k, 7) - 0.1
    v1 = 20 * eo(prog(tl, t1, 0.6))
    # bar 2: hingga 2000 mA
    t2a, t2b, t2c = wt(k, 14), wt(k, 16), wt(k, 17) + 0.6
    v2 = 500 * eo(prog(tl, t2a, t2b - t2a)) + 1500 * eo(prog(tl, t2b, t2c - t2b))
    hit = wt(k, 22)
    danger = prog(tl, wt(k, 19), 0.2)
    for x, v, col, lab in ((xs[0], v1, CYAN, "PIN ARDUINO"), (xs[1], v2, RED, "MOTOR DC")):
        hgt = max(14 if v > 0 else 0, full * v / 2000)
        if x == xs[0] and danger > 0:
            fl = 0.5 + 0.5 * math.sin(tl * 25)
            col = tuple(CYAN[j] * (1 - fl) + RED[j] * fl for j in range(3))
        if hgt > 0:
            g = cairo.LinearGradient(0, base - hgt, 0, base)
            g.add_color_stop_rgb(0, *col); g.add_color_stop_rgb(1, col[0] * 0.5, col[1] * 0.5, col[2] * 0.6)
            rrect(c, x - 96, base - hgt - 0, 192, hgt, 18); c.set_source(g); c.fill()
            glow_circle(c, x, base - hgt, 140, col, 0.3)
        a = pop(tl, 0.4 + (0 if x == xs[0] else 0.15))
        text(c, lab, x, base + 55, 40, GREY, FONT_B, a=clamp(a))
        if v > 0:
            text(c, f"{int(round(v))} mA", x, base - max(hgt, 14) - 60, 64, WHITE, FONT, stroke=10)
    # label perbandingan
    if tl > t2c:
        p = pop(tl, t2c - 0.1)
        pill(c, xs[1], top + 100, "100x LEBIH!", YEL, p * 0.9, 40)
    # panah dipaksa
    ta = wt(k, 19)
    if tl >= ta:
        p = eo(prog(tl, ta, 0.35))
        x0, x1 = 640, 640 - 180 * p
        y = base - 120 + 8 * math.sin(tl * 30)
        c.set_line_width(26); c.set_line_cap(cairo.LINE_CAP_ROUND); rgba(c, RED)
        c.move_to(x0, y); c.line_to(x1, y); c.stroke()
        c.move_to(x1 - 40, y); c.line_to(x1 + 10, y - 40); c.line_to(x1 + 10, y + 40); c.close_path(); c.fill()
    spark(c, xs[0], base - 30, tl - hit, seed=9, scale=0.9)
    smoke(c, xs[0], base - 80, tl - hit - 0.2, seed=4)
    if tl >= hit:
        s = pop(tl, hit + 0.05, 0.4)
        warning(c, xs[0], 900, s * (1 + 0.05 * math.sin(tl * 12)))
        pill(c, xs[0], 1040, "JEBOL!", RED, pop(tl, hit + 0.2), 46, WHITE)


def sc_analogy(c, tl, t, sc):
    k = "analogy"
    ARD, DRV, BAT, MOT = (540, 570), (540, 990), (165, 990), (905, 990)
    tsig = wt(k, 8)
    sa = eo(prog(tl, tsig, 0.35))
    wire(c, [(ARD[0], ARD[1] + 100), (DRV[0], DRV[1] - 116)], 7, CYAN, t, a=sa, speed=120, dash=(6, 22))
    if sa > 0:
        text(c, "SINYAL KECIL", 575, 785, 36, CYAN, FONT_B, "l", a=sa, stroke=8, sa=0.6)
    tp = wt(k, 16)
    pa = eo(prog(tl, tp, 0.4))
    wire(c, [(BAT[0] + 60, DRV[1]), (DRV[0] - 172, DRV[1])], 20, ORANGE, t, a=pa, speed=260, dash=(24, 22))
    wire(c, [(DRV[0] + 172, DRV[1]), (MOT[0] - 100, DRV[1])], 20, ORANGE, t, a=pa, speed=260, dash=(24, 22))
    if pa > 0:
        pill(c, DRV[0], 1170, "ARUS BESAR", ORANGE, pa, 40)
    scaled(c, *ARD, pop(tl, wt(k, 6) - 0.2), lambda: arduino(c, *ARD, 0.72, 0, t))
    scaled(c, *DRV, pop(tl, wt(k, 3)), lambda: driver(c, *DRV, 1.0, t, pa))
    if tl > wt(k, 3):
        dt = tl - wt(k, 3)
        c.arc(DRV[0], DRV[1], 200 + 400 * dt, 0, 2 * math.pi); c.set_line_width(6)
        rgba(c, YEL, clamp(0.7 - dt)); c.stroke()
    scaled(c, *BAT, pop(tl, wt(k, 14)), lambda: battery(c, *BAT, 0.85, t))
    om = T.omega(t)
    scaled(c, *MOT, pop(tl, wt(k, 15)), lambda: motor(c, *MOT, 95, T.angle(t), om, ORANGE))
    pill(c, 175, 470, "OTAK", PINK, pop(tl, wt(k, 23)), 50)
    pill(c, 540, 1290, "OTOT", YEL, pop(tl, wt(k, 28)), 54)
    if tl > wt(k, 23):
        c.set_line_width(5); rgba(c, PINK, eo(prog(tl, wt(k, 23), 0.3)))
        c.move_to(250, 495); c.line_to(330, 530); c.stroke()


def sc_hbridge(c, tl, t, sc):
    k = "hbridge"
    xL, xR, yT, yB, yM = 270, 810, 560, 1300, 930
    MC = (540, yM)
    ca = eo(prog(tl, wt(k, 10), 0.45))
    tA, tB = wt(k, 19), wt(k, 24)
    # status saklar: 1=tutup
    def sw_state(name):
        if name == "S1": on, off = tA, tB
        elif name == "S4": on, off = tA + 0.15, tB + 0.05
        elif name == "S2": on, off = tB + 0.2, 1e9
        else: on, off = tB + 0.35, 1e9
        return eo(prog(tl, on, 0.12)) * (1 - eo(prog(tl, off, 0.12)))
    SW = {"S1": (xL, yT + 70, yT + 230), "S3": (xL, yM + 140, yM + 300),
          "S2": (xR, yT + 70, yT + 230), "S4": (xR, yM + 140, yM + 300)}
    if ca > 0:
        c.save(); c.translate(0, 40 * (1 - ca))
        # H highlight
        th = wt(k, 17)
        hl = clamp(1 - abs(tl - th - 0.4) / 0.6)
        if hl > 0:
            c.set_line_width(70); c.set_line_cap(cairo.LINE_CAP_ROUND); rgba(c, YEL, 0.22 * hl)
            c.move_to(xL, yT); c.line_to(xL, yB); c.move_to(xR, yT); c.line_to(xR, yB)
            c.move_to(xL, yM); c.line_to(xR, yM); c.stroke()
        base = (0.55, 0.6, 0.72)
        segs = [[(xL, yT), (xR, yT)], [(xL, yB), (xR, yB)],
                [(xL, yT), (xL, SW["S1"][1])], [(xL, SW["S1"][2]), (xL, SW["S3"][1])], [(xL, SW["S3"][2]), (xL, yB)],
                [(xR, yT), (xR, SW["S2"][1])], [(xR, SW["S2"][2]), (xR, SW["S4"][1])], [(xR, SW["S4"][2]), (xR, yB)],
                [(xL, yM), (MC[0] - 95, yM)], [(MC[0] + 95, yM), (xR, yM)]]
        for sg in segs:
            wire(c, sg, 8, base, t, flow=False, a=ca)
        for x, y in ((xL, yM), (xR, yM)):
            c.arc(x, y, 12, 0, 2 * math.pi); rgba(c, base, ca); c.fill()
        text(c, "+12V", 540, yT - 45, 44, RED, FONT, a=ca)
        text(c, "GND", 540, yB + 45, 44, GREY, FONT, a=ca)
        # jalur arus
        fa = eo(prog(tl, tA + 0.3, 0.3)) * (1 - eo(prog(tl, tB, 0.15)))
        pathA = [(540, yT), (xL, yT), (xL, yM), (xR, yM), (xR, yB), (540, yB)]
        wire(c, pathA, 14, GREEN, t, a=fa * ca, speed=300, dash=(20, 24))
        fb = eo(prog(tl, tB + 0.4, 0.3))
        pathB = [(540, yT), (xR, yT), (xR, yM), (xL, yM), (xL, yB), (540, yB)]
        wire(c, pathB, 14, ORANGE, t, a=fb * ca, speed=300, dash=(20, 24))
        # saklar
        for name, (x, ya, yb) in SW.items():
            st = sw_state(name)
            col = tuple(GREY[j] * (1 - st) + GREEN[j] * st for j in range(3))
            ang = (1 - st) * 0.6 * (-1 if x == xL else 1)
            L = yb - ya
            c.set_line_width(12); c.set_line_cap(cairo.LINE_CAP_ROUND); rgba(c, col, ca)
            c.move_to(x, ya); c.line_to(x + L * math.sin(ang), ya + L * math.cos(ang)); c.stroke()
            for yy in (ya, yb):
                c.arc(x, yy, 13, 0, 2 * math.pi); rgba(c, WHITE, ca); c.fill()
            lx = x - 70 if x == xL else x + 70
            text(c, name, lx, (ya + yb) / 2, 40, col, FONT, a=ca)
        c.restore()
    om = T.omega(t)
    scaled(c, *MC, pop(tl, 0.25), lambda: motor(c, *MC, 92, T.angle(t), om, CYAN))
    # tanda tanya awal maju/mundur
    q = pop(tl, 0.5) * (1 - eo(prog(tl, wt(k, 10), 0.3)))
    if q > 0:
        spin_arrow(c, *MC, 150, 1, GREEN, q * 0.9, t)
        text(c, "MAJU?", 540, yM - 230, 50, GREEN, FONT, a=q, stroke=8)
        text(c, "MUNDUR?", 540, yM + 230, 50, ORANGE, FONT, a=q, stroke=8)
    # arah
    ra = eo(prog(tl, tA + 0.6, 0.3)) * (1 - eo(prog(tl, tB, 0.15)))
    rb = eo(prog(tl, tB + 0.9, 0.3))
    spin_arrow(c, *MC, 135, 1, GREEN, ra, t)
    spin_arrow(c, *MC, 135, -1, ORANGE, rb, t)
    pill(c, 540, yM - 210, "KANAN", GREEN, ra, 44)
    pill(c, 540, yM - 210, "KIRI", ORANGE, rb, 44)


def sc_pwm(c, tl, t, sc):
    k = "pwm"
    x0, y0, w, h = 90, 450, 900, 360
    s = pop(tl, 0.15)
    D = float(T.duty_pwm(tl))
    def scope():
        rrect(c, x0, y0, w, h, 28); rgba(c, (0.02, 0.08, 0.06)); c.fill_preserve()
        c.set_line_width(4); rgba(c, GREEN, 0.5); c.stroke()
        c.set_line_width(1.5); rgba(c, GREEN, 0.12)
        for gx in range(x0 + 75, x0 + w, 75): c.move_to(gx, y0 + 20); c.line_to(gx, y0 + h - 20)
        for gy in range(y0 + 60, y0 + h, 60): c.move_to(x0 + 20, gy); c.line_to(x0 + w - 20, gy)
        c.stroke()
        hi, lo = y0 + 95, y0 + h - 75
        per = 150
        ph = t * 260
        c.save(); rrect(c, x0 + 6, y0 + 6, w - 12, h - 12, 24); c.clip()
        c.new_path()
        started = False
        X = x0 - per
        xs = X - (ph % per)
        while xs < x0 + w + per:
            on_end = xs + per * D
            for xa, ya in ((xs, lo), (xs, hi if D > 0 else lo), (on_end, hi if D > 0 else lo), (on_end, lo), (xs + per, lo)):
                if not started: c.move_to(xa, ya); started = True
                else: c.line_to(xa, ya)
            xs += per
        c.set_line_join(cairo.LINE_JOIN_MITER)
        c.set_line_width(18); rgba(c, YEL, 0.18); c.stroke_preserve()
        c.set_line_width(7); rgba(c, YEL); c.stroke()
        c.restore()
        text(c, "ON", x0 + 50, hi, 30, GREEN, FONT_B, a=0.9 if D > 0 else 0.3)
        text(c, "OFF", x0 + 50, lo, 30, RED, FONT_B, a=0.9)
    scaled(c, W / 2, y0 + h / 2, s, scope)
    # duty readout
    if tl > wt(k, 5):
        a = eo(prog(tl, wt(k, 5), 0.3))
        pill(c, W / 2, 880, f"NYALA {int(round(D * 100))}%", YEL, a, 46)
    # motor + gauge
    om = T.omega(t)
    MC = (540, 1180)
    sm = pop(tl, 0.3)
    def mot():
        frac = clamp(abs(om) / 2.4)
        c.set_line_cap(cairo.LINE_CAP_ROUND)
        a0, a1 = math.radians(135), math.radians(405)
        c.set_line_width(22); rgba(c, WHITE, 0.1); c.arc(MC[0], MC[1], 200, a0, a1); c.stroke()
        if frac > 0.005:
            col = tuple(GREEN[j] * (1 - frac) + RED[j] * frac for j in range(3))
            rgba(c, col); c.arc(MC[0], MC[1], 200, a0, a0 + (a1 - a0) * frac); c.stroke()
        motor(c, *MC, 140, T.angle(t), om, YEL)
        text(c, "KECEPATAN", MC[0], MC[1] + 205, 30, GREY, FONT_B)
    scaled(c, *MC, sm, mot)
    # label penjelas
    tq = wt(k, 9)
    if tq - 0.3 < tl < wt(k, 12):
        pill(c, W / 2, y0 - 2, "SUPER CEPAT!", CYAN, pop(tl, wt(k, 10)), 34)


def sc_examples(c, tl, t, sc):
    k = "examples"
    cards = [("L298N", "±2A • motor sedang", RED, wt(k, 5)),
             ("L293D", "±0.6A • motor kecil", (0.75, 0.78, 0.85), wt(k, 6)),
             ("TB6612FNG", "±1.2A • efisien, adem", PURPLE, wt(k, 8))]
    hl = wt(k, 10)
    for i, (name, tag, col, ta) in enumerate(cards):
        cy = 560 + i * 285
        p = eback(prog(tl, ta - 0.15, 0.45)) if tl >= ta - 0.15 else 0
        if p <= 0: continue
        dx = (1 - p) * 700
        c.save(); c.translate(dx, 0)
        rrect(c, 80, cy - 120, 920, 240, 34); rgba(c, (0.09, 0.11, 0.22), 0.95); c.fill_preserve()
        pulse = 0.5 + 0.5 * math.sin((tl - hl) * 6 - i) if tl > hl else 0
        c.set_line_width(5); rgba(c, col, 0.6 + 0.4 * pulse); c.stroke()
        # ilustrasi mini
        ix, iy = 235, cy
        if i == 0:
            rrect(c, ix - 100, iy - 80, 200, 160, 16); rgba(c, (0.78, 0.12, 0.2)); c.fill()
            rrect(c, ix - 55, iy - 70, 110, 70, 6); rgba(c, (0.15, 0.15, 0.17)); c.fill()
            for q in range(6):
                c.rectangle(ix - 48 + q * 18, iy - 64, 8, 58); rgba(c, (0.35, 0.36, 0.4)); c.fill()
            for sx in (ix - 92, ix + 62):
                rrect(c, sx, iy + 10, 30, 52, 4); rgba(c, (0.15, 0.4, 0.9)); c.fill()
        elif i == 1:
            rrect(c, ix - 55, iy - 85, 110, 170, 10); rgba(c, (0.12, 0.12, 0.14)); c.fill()
            for q in range(8):
                for sx in (-1, 1):
                    c.rectangle(ix + sx * 55 - (14 if sx > 0 else 0) + (0 if sx > 0 else 0), iy - 72 + q * 20, 14, 9)
                    rgba(c, (0.8, 0.8, 0.84)); c.fill()
            c.arc(ix, iy - 70, 9, 0, math.pi); rgba(c, (0.3, 0.3, 0.33)); c.fill()
        else:
            rrect(c, ix - 90, iy - 60, 180, 120, 12); rgba(c, (0.45, 0.25, 0.75)); c.fill()
            rrect(c, ix - 30, iy - 25, 60, 50, 4); rgba(c, (0.1, 0.1, 0.12)); c.fill()
            for q in range(8):
                c.arc(ix - 70 + q * 20, iy + 45, 6, 0, 2 * math.pi); rgba(c, (0.85, 0.7, 0.3)); c.fill()
                c.arc(ix - 70 + q * 20, iy - 45, 6, 0, 2 * math.pi); c.fill()
        size = 70 if len(name) < 8 else 58
        text(c, name, 380, cy - 32, size, WHITE, FONT, "l")
        text(c, tag, 382, cy + 48, 36, col if i != 1 else GREY, FONT_B, "l")
        c.restore()


def sc_outro(c, tl, t, sc):
    k = "outro"
    A, D = (290, 640), (790, 640)
    MC = (540, 1040)
    sa = pop(tl, wt(k, 3) - 0.15)
    sd = pop(tl, wt(k, 6) - 0.15)
    wa = eo(prog(tl, wt(k, 6), 0.4))
    wire(c, [(A[0] + 140, A[1]), (D[0] - 125, D[1])], 7, CYAN, t, a=wa, dash=(6, 22))
    wire(c, [(D[0], D[1] + 85), (D[0], MC[1]), (MC[0] + 85, MC[1])], 16, ORANGE, t, a=wa, speed=240, dash=(24, 22))
    scaled(c, *A, sa, lambda: arduino(c, *A, 0.62, 0, t))
    scaled(c, *D, sd, lambda: driver(c, *D, 0.72, t, wa))
    text(c, "ARDUINO", A[0], A[1] + 130, 40, GREY, FONT_B, a=clamp(sa))
    text(c, "MOTOR DRIVER", D[0], D[1] + 130, 40, GREY, FONT_B, a=clamp(sd))
    pill(c, A[0], A[1] - 165, "= OTAK", PINK, pop(tl, wt(k, 5)), 50)
    pill(c, D[0], D[1] - 165, "= OTOT", YEL, pop(tl, wt(k, 9)), 50)
    om = T.omega(t)
    scaled(c, *MC, sd, lambda: motor(c, *MC, 85, T.angle(t), om, ORANGE))
    # follow
    tf = wt(k, 10)
    if tl >= tf:
        p = pop(tl, tf, 0.45)
        tap = tf + 0.7
        pulse = 1 + 0.04 * math.sin((tl - tf) * 7)
        squish = 1 - 0.08 * math.exp(-max(0, tl - tap) * 12) * (tl > tap)
        followed = tl > tap
        def btn():
            w, h = 560, 130
            col = (0.18, 0.2, 0.28) if followed else (0.99, 0.17, 0.36)
            rrect(c, W / 2 - w / 2, 1260 - h / 2, w, h, h / 2); rgba(c, col); c.fill()
            text(c, "✓ FOLLOWING" if followed else "+ FOLLOW", W / 2, 1260, 56, WHITE, FONT)
        scaled(c, W / 2, 1260, p * pulse * squish, btn)
        if tl > tap:
            dt = tl - tap
            c.arc(W / 2 + 150, 1275, 30 + 160 * dt, 0, 2 * math.pi); c.set_line_width(6)
            rgba(c, WHITE, clamp(0.8 - dt * 1.4)); c.stroke()
        # kursor tangan (lingkaran tap)
        if tf + 0.3 < tl < tap + 0.6:
            q = eo(prog(tl, tf + 0.3, 0.4))
            x, y = W / 2 + 150 + 200 * (1 - q), 1275 + 220 * (1 - q)
            c.arc(x, y, 34, 0, 2 * math.pi); rgba(c, WHITE, 0.85); c.fill()
            c.arc(x, y, 34, 0, 2 * math.pi); c.set_line_width(5); rgba(c, (0, 0, 0), 0.4); c.stroke()
    # end card setelah suara selesai
    te = sc["lead"] + sc["vdur"] + 0.1
    if tl > te:
        a = eo(prog(tl, te, 0.4))
        text(c, "Simpan & share ke temanmu", W / 2, 1450, 50, WHITE, FONT, a=a, stroke=10)
        text(c, "yang lagi belajar robotik!", W / 2, 1515, 50, YEL, FONT, a=a, stroke=10)


DRAW = dict(hook=sc_hook, problem=sc_problem, analogy=sc_analogy, hbridge=sc_hbridge,
            pwm=sc_pwm, examples=sc_examples, outro=sc_outro)


def frame(i):
    t = i / FPS
    sc = T.scene_at(t)
    tl = t - sc["start"]
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    c = cairo.Context(surf)
    c.set_antialias(cairo.ANTIALIAS_BEST)
    background(c, t)
    # shake
    sx = sy = 0.0
    for ts, amp in T.SHAKES:
        d = t - ts
        if 0 <= d < 0.7:
            e = amp * math.exp(-d * 7)
            sx += e * math.sin(d * 71 + 1.3); sy += e * math.cos(d * 63)
    c.save(); c.translate(sx, sy)
    # transisi masuk/keluar
    pin = eo(prog(tl, 0, 0.32)); pout = eo(prog(tl, sc["len"] - 0.18, 0.18)) if sc["key"] != "outro" else 0
    c.push_group()
    title(c, tl, sc)
    DRAW[sc["key"]](c, tl, t, sc)
    c.pop_group_to_source()
    m = cairo.Matrix(); m.translate(-140 * (1 - pin) + 140 * pout, 0)
    s = 0.94 + 0.06 * pin
    src = c.get_source()
    mm = cairo.Matrix(xx=1 / s, yy=1 / s, x0=-(W / 2) * (1 / s - 1) + 140 * (1 - pin) - 140 * pout,
                      y0=-(H / 2) * (1 / s - 1))
    src.set_matrix(mm)
    c.paint_with_alpha(clamp(pin * (1 - pout)))
    c.restore()
    captions(c, tl, sc)
    hud(c, t, sc)
    # flash
    for ts, col, a in T.FLASHES:
        d = t - ts
        if 0 <= d < 0.5:
            rgba(c, col, a * math.exp(-d * 9)); c.paint()
    # fade-in awal & akhir
    if t < 0.12:
        rgba(c, (0, 0, 0), 1 - t / 0.12); c.paint()
    if t > T.TOTAL - 0.5:
        rgba(c, (0, 0, 0), clamp((t - (T.TOTAL - 0.5)) / 0.5)); c.paint()
    vignette(c)
    surf.flush()
    return bytes(surf.get_data())


def main(out_video, audio, frames=None):
    n = T.NFRAMES if frames is None else frames
    cmd = ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-i", audio,
           "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-pix_fmt", "yuv420p",
           "-profile:v", "high", "-movflags", "+faststart",
           "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-shortest", out_video]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with Pool(os.cpu_count()) as pool:
        for k, buf in enumerate(pool.imap(frame, range(n), chunksize=4)):
            p.stdin.write(buf)
            if k % 150 == 0: print(f"frame {k}/{n}", flush=True)
    p.stdin.close(); p.wait()
    print("done", out_video)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else None)
