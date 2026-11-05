import React from 'react';
import { random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { IconHati, IconJam, IconKirim } from '../components/Icons';
import { Sfx } from '../components/overlays';
import { Label, Phone, Thumb, lerp, maju } from '../components/ui';
import { C, FONT, KATEGORI, Kategori } from '../theme';
import { Adegan, frameKata } from '../timing';

const COLS = 14;
const ROWS = 10;
const N = COLS * ROWS;
const TERPILIH = Array.from({ length: 24 }, (_, i) => Math.floor((i * N) / 24 + random(`sel${i}`) * 4));

const KANDIDAT: { k: Kategori; x: number; skor: [number, number, number] }[] = [
  { k: 'masak', x: 215, skor: [0.55, 0.45, 0.3] },
  { k: 'kucing', x: 540, skor: [0.95, 0.75, 0.85] },
  { k: 'bola', x: 865, skor: [0.3, 0.4, 0.2] },
];

export const Turnamen: React.FC<{ a: Adegan }> = ({ a }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fRatusan = frameKata(a, 'ratusan', 1, 40);
  const fNilai = frameKata(a, 'nilai', 1, 85);
  const fHabis = frameKata(a, 'habis', 1, 120);
  const fLike = frameKata(a, 'like', 1, 135);
  const fKirim = frameKata(a, 'kirim', 1, 150);
  const fTertinggi = frameKata(a, 'tertinggi', 1, 175);
  const fLayar = frameKata(a, 'layarmu', 1, 200);

  const tSaring = spring({ frame: f - fRatusan, fps, config: { damping: 18 } });
  const tKandidat = spring({ frame: f - fNilai, fps, config: { damping: 16 } });
  const tMenang = spring({ frame: f - fTertinggi, fps, config: { damping: 10 } });
  const tLayar = spring({ frame: f - fLayar + 4, fps, config: { damping: 16 } });

  const kotak = Array.from({ length: N }, (_, i) => {
    const c = i % COLS;
    const r = Math.floor(i / COLS);
    const k = KATEGORI[Math.floor(random(`k${i}`) * KATEGORI.length)];
    return { i, k, x: 137 + c * 62, y: 545 + r * 62 };
  });

  const tahap =
    f >= fTertinggi ? '1 pemenang' : f >= fNilai ? 'dikasih nilai' : f >= fRatusan ? 'ratusan kandidat' : 'jutaan video';

  return (
    <>
      {/* Tahap 1–2: jutaan → ratusan */}
      {kotak.map((b) => {
        const idx = TERPILIH.indexOf(b.i);
        const muncul = maju(f, (b.i % 20) * 0.6, (b.i % 20) * 0.6 + 8);
        if (idx === -1) {
          const jatuh = maju(f, fRatusan + random(`j${b.i}`) * 10, fRatusan + 14 + random(`j${b.i}`) * 10);
          if (jatuh >= 1) return null;
          return (
            <div
              key={b.i}
              style={{
                position: 'absolute',
                left: b.x - 25,
                top: b.y - 25 + jatuh * 380,
                width: 50,
                height: 50,
                borderRadius: 10,
                background: C[b.k],
                opacity: (1 - jatuh) * 0.85 * muncul,
                transform: `rotate(${jatuh * (random(`r${b.i}`) - 0.5) * 120}deg)`,
              }}
            />
          );
        }
        // kotak terpilih: pindah ke grid kandidat 6x4
        const c = idx % 6;
        const r = Math.floor(idx / 6);
        const gx = 540 + (c - 2.5) * 140;
        const gy = 840 + (r - 1.5) * 150;
        const kand = idx < 3 ? KANDIDAT[idx] : null;
        if (kand && tKandidat > 0.02) return null; // diganti kartu kandidat
        const hilang = idx >= 3 ? tKandidat : 0;
        if (hilang > 0.99) return null;
        const kk = kand ? kand.k : b.k;
        const s = lerp(50, 100, tSaring);
        return (
          <div
            key={b.i}
            style={{
              position: 'absolute',
              left: lerp(b.x, gx, tSaring) - s / 2,
              top: lerp(b.y, gy, tSaring) - s * 0.65,
              width: s,
              height: s * 1.3,
              borderRadius: 12,
              background: `linear-gradient(160deg, ${C[kk]}, ${C[kk]}99)`,
              opacity: (1 - hilang) * muncul,
              transform: `scale(${1 - hilang * 0.5})`,
            }}
          />
        );
      })}

      {/* Tahap 3: kandidat diberi nilai */}
      {tKandidat > 0.02 &&
        KANDIDAT.map((k, i) => {
          const menang = k.k === 'kucing';
          const redup = menang ? 1 : 1 - tMenang * 0.65;
          const keLayar = menang ? tLayar : 0;
          const hilangLain = menang ? 0 : tLayar;
          const total = Math.round(
            100 *
              (k.skor[0] * maju(f, fHabis, fHabis + 12) * 0.5 +
                k.skor[1] * maju(f, fLike, fLike + 12) * 0.2 +
                k.skor[2] * maju(f, fKirim, fKirim + 12) * 0.3),
          );
          // mulai dari posisi kotak kandidat di grid 6x4 (baris pertama)
          const awalX = 540 + (i - 2.5) * 140;
          const x = lerp(lerp(awalX, k.x, tKandidat), 540, keLayar);
          const y = lerp(lerp(615, 690, tKandidat), 905, keLayar);
          return (
            <React.Fragment key={k.k}>
              <Thumb
                k={k.k}
                x={x}
                y={y}
                w={lerp(lerp(100, 240, tKandidat), 336, keLayar)}
                h={lerp(lerp(130, 310, tKandidat), 620, keLayar)}
                opacity={redup * (1 - hilangLain)}
                glow={menang ? tMenang : 0}
                scale={menang ? 1 + 0.08 * tMenang * (1 - keLayar) : 1}
              />
              <div
                style={{
                  position: 'absolute',
                  left: k.x - 125,
                  top: 870,
                  width: 250,
                  opacity: tKandidat * redup * (1 - tLayar),
                  fontFamily: FONT,
                }}
              >
                {[
                  { ikon: <IconJam size={36} color={C.kamu} />, p: maju(f, fHabis, fHabis + 12) * k.skor[0], w: C.kamu },
                  { ikon: <IconHati size={36} />, p: maju(f, fLike, fLike + 12) * k.skor[1], w: C.kucing },
                  { ikon: <IconKirim size={36} />, p: maju(f, fKirim, fKirim + 12) * k.skor[2], w: C.algo },
                ].map((r, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 52 }}>
                    {r.ikon}
                    <div style={{ flex: 1, height: 22, borderRadius: 99, background: '#ffffff18' }}>
                      <div style={{ width: `${r.p * 100}%`, height: '100%', borderRadius: 99, background: r.w }} />
                    </div>
                  </div>
                ))}
                <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 54, color: menang && tMenang > 0.5 ? C.kamu : C.text, marginTop: 6 }}>
                  {total}
                </div>
              </div>
            </React.Fragment>
          );
        })}

      {/* Tahap 4: muncul di layar HP */}
      {tLayar > 0.01 && (
        <Phone x={540} y={905} w={380} h={700} scale={0.6 + 0.4 * tLayar} opacity={tLayar}>
          <div />
        </Phone>
      )}
      {tLayar > 0.01 && (
        <Thumb k="kucing" x={540} y={905} w={336} h={634} opacity={tLayar} glow={0.4} progress={maju(f, fLayar + 6, a.durationInFrames)} />
      )}

      <Label x={540} y={1180} teks={tahap} warna={C.muted} size={36} opacity={1 - tLayar} />

      <Sfx at={4} src="whoosh" volume={0.4} />
      <Sfx at={fRatusan} src="whoosh" volume={0.5} />
      <Sfx at={fNilai} src="pop" />
      <Sfx at={fHabis} src="tick" />
      <Sfx at={fLike} src="tick" />
      <Sfx at={fKirim} src="tick" />
      <Sfx at={fTertinggi} src="ding" volume={0.5} />
      <Sfx at={fLayar} src="blip" />
    </>
  );
};
