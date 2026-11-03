"""Cover/thumbnail 1080x1920 untuk Reels/TikTok. Hal penting ada di area tengah 3:4 (aman untuk crop grid profil)."""
import math, sys
import cairo
import render as R
from render import (W, H, YEL, RED, WHITE, PINK, CYAN, GREY, ORANGE, DARK, FONT, FONT_B,
                    text, text_w, rrect, rgba, glow_circle, pill, wire, warning)

out = sys.argv[1] if len(sys.argv) > 1 else "cover.png"
surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
c = cairo.Context(surf)
c.set_antialias(cairo.ANTIALIAS_BEST)
R.background(c, 3.0)

# label kecil
pill(c, W / 2, 330, "ELEKTRONIKA SIMPEL", CYAN, 1.0, 40)

# judul besar
glow_circle(c, W / 2, 620, 520, YEL, 0.12)
text(c, "APA ITU", W / 2, 455, 96, WHITE, FONT, stroke=14, sa=0.7)
text(c, "MOTOR", W / 2, 590, 210, WHITE, FONT, stroke=18, sa=0.7)
c.save(); c.translate(W / 2, 830); c.rotate(-0.03)
w = text_w(c, "DRIVER?", 210) + 70
rrect(c, -w / 2, -125, w, 250, 34); rgba(c, YEL); c.fill()
text(c, "DRIVER?", 0, 0, 210, DARK, FONT)
c.restore()

# diagram: Arduino -> driver -> motor
A, D, M = (200, 1150), (560, 1150), (900, 1150)
wire(c, [(A[0] + 120, A[1]), (D[0] - 130, D[1])], 8, CYAN, 0.3, dash=(6, 22))
wire(c, [(D[0] + 130, D[1]), (M[0] - 95, M[1])], 20, ORANGE, 0.3, dash=(24, 22))
R.arduino(c, *A, 0.6, 0, 0)
R.driver(c, *D, 0.75, 0, 1.0)
R.motor(c, *M, 100, 0.08, 2.4, ORANGE)
pill(c, A[0], 1305, "OTAK", PINK, 1.0, 42)
pill(c, D[0], 1305, "OTOT", YEL, 1.0, 42)
pill(c, M[0], 1305, "GERAK", ORANGE, 1.0, 42)

# banner peringatan
c.save(); c.translate(W / 2, 1480); c.rotate(0.02)
bw = 940
rrect(c, -bw / 2, -78, bw, 156, 32); rgba(c, RED); c.fill()
text(c, "JANGAN COLOK LANGSUNG!", 50, 0, 54, WHITE, FONT)
warning(c, -bw / 2 + 80, 8, 0.48)
c.restore()

# chip topik
x = W / 2
tags = ["H-BRIDGE", "PWM", "L298N"]
sizes = [text_w(c, t, 36) + 60 for t in tags]
tot = sum(sizes) + 24 * (len(tags) - 1)
cx = W / 2 - tot / 2
for t, s in zip(tags, sizes):
    rrect(c, cx, 1620, s, 66, 33); rgba(c, WHITE, 0.12); c.fill()
    text(c, t, cx + s / 2, 1653, 36, WHITE, FONT_B)
    cx += s + 24

R.vignette(c)
surf.write_to_png(out)
print("ok", out)
