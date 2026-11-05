import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { Algo } from '../components/Algo';
import { IconCentang, IconHati, IconJam, IconKirim, IconSilang, IkonKategori } from '../components/Icons';
import { Sfx } from '../components/overlays';
import { Phone, lerp, maju } from '../components/ui';
import { C, FONT, Kategori } from '../theme';
import { Adegan, frameKata, sedangBicara } from '../timing';

const FEED: Kategori[] = ['bola', 'kucing', 'galau', 'masak', 'robot'];
const PW = 380;
const PH = 700;
const LH = PH - 2 * PW * 0.035; // tinggi layar dalam HP

type Entri = { mulai: number; ikon: React.ReactNode; teks: string; warna: string };

export const Sinyal: React.FC<{ a: Adegan }> = ({ a }) => {
  const f = useCurrentFrame();
  const fBerhenti = frameKata(a, 'berhenti', 1, 30);
  const fHabis = frameKata(a, 'habis', 1, 55);
  const fKirim = frameKata(a, 'kirim', 1, 75);
  const fSkip = frameKata(a, 'skip', 1, 100);
  const fTapi = frameKata(a, 'tapi', 1, 150);
  const fLama = frameKata(a, 'lama', 1, 175);

  // posisi scroll feed (dalam satuan kartu)
  let scroll = interpolate(f, [0, fBerhenti], [0, 1], { extrapolateRight: 'clamp' });
  scroll += maju(f, fSkip, fSkip + 6);
  scroll += maju(f, fSkip + 12, fSkip + 18);
  const progressKucing = maju(f, fBerhenti + 4, fHabis + 6);

  const keluar = maju(f, fTapi - 4, fTapi + 8);

  const entri: Entri[] = [
    { mulai: fBerhenti + 10, ikon: <IconJam size={46} color={C.kamu} />, teks: 'berhenti 2,4 dtk', warna: C.kamu },
    { mulai: fHabis + 8, ikon: <IconCentang size={46} />, teks: 'nonton sampai habis', warna: C.ok },
    { mulai: fKirim + 8, ikon: <IconKirim size={46} />, teks: 'kirim ke teman', warna: C.algo },
    { mulai: fSkip + 14, ikon: <IconSilang size={40} />, teks: 'skip 0,3 dtk', warna: C.danger },
  ];
  const menulis = entri.some((e) => f >= e.mulai - 2 && f < e.mulai + 14);

  // chip yang terbang dari HP ke buku catatan
  const chip = (mulai: number, ikon: React.ReactNode, idx: number) => {
    const t = maju(f, mulai - 12, mulai);
    if (f < mulai - 14 || f > mulai + 1) return null;
    const x = lerp(300, 620, t);
    const y = lerp(760, 640 + idx * 92, t) - Math.sin(t * Math.PI) * 120;
    return (
      <div
        key={idx}
        style={{
          position: 'absolute',
          left: x - 40,
          top: y - 40,
          width: 80,
          height: 80,
          borderRadius: 99,
          background: C.panel,
          border: `4px solid ${C.text}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${1 - t * 0.3})`,
        }}
      >
        {ikon}
      </div>
    );
  };

  // perbandingan bobot di akhir
  const barNonton = maju(f, fLama, fLama + 18);
  const barLike = maju(f, fTapi + 12, fTapi + 26);

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - keluar, transform: `scale(${1 - keluar * 0.15})` }}>
        <Phone x={300} y={830} w={PW} h={PH}>
          {FEED.map((k, i) => {
            const top = (i - scroll) * LH;
            if (top > LH || top < -LH) return null;
            const skip = k === 'galau' && f > fSkip + 4;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top,
                  height: LH,
                  background: `linear-gradient(170deg, ${C[k]}50, ${C[k]}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IkonKategori k={k} size={170} />
                {k === 'kucing' && (
                  <>
                    <div style={{ position: 'absolute', left: 24, right: 24, bottom: 36, height: 10, borderRadius: 9, background: '#ffffff30' }}>
                      <div style={{ width: `${progressKucing * 100}%`, height: '100%', borderRadius: 9, background: C.text }} />
                    </div>
                    <div style={{ position: 'absolute', right: 22, bottom: 90, transform: `scale(${maju(f, fKirim, fKirim + 8)})` }}>
                      <IconKirim size={64} />
                    </div>
                  </>
                )}
                {skip && (
                  <div style={{ position: 'absolute', transform: `scale(${maju(f, fSkip + 4, fSkip + 9)})` }}>
                    <IconSilang size={150} />
                  </div>
                )}
              </div>
            );
          })}
        </Phone>

        {/* Buku catatan Algo */}
        <div
          style={{
            position: 'absolute',
            left: 545,
            top: 500,
            width: 440,
            height: 470,
            borderRadius: 32,
            background: '#F4F6FB',
            boxShadow: '0 20px 60px #00000080',
            padding: '26px 28px',
            boxSizing: 'border-box',
            fontFamily: FONT,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 30, color: C.bg, letterSpacing: 2, marginBottom: 14 }}>CATATAN ALGO</div>
          {entri.map((e, i) => {
            const o = maju(f, e.mulai, e.mulai + 6);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  height: 92,
                  borderTop: '3px dashed #C5CCE6',
                  opacity: o,
                  transform: `translateX(${(1 - o) * 30}px)`,
                }}
              >
                <div style={{ width: 62, height: 62, borderRadius: 99, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {e.ikon}
                </div>
                <span style={{ fontWeight: 700, fontSize: 33, color: C.bg }}>{e.teks}</span>
              </div>
            );
          })}
        </div>
        <Algo x={800} y={1105} scale={0.55} pose="catatan" menulis={menulis} bicara={sedangBicara(a, f)} lihat={{ x: -12, y: -8 }} />
        {entri.map((e, i) => chip(e.mulai, e.ikon, i))}
      </div>

      {/* Bobot: lama nonton vs like */}
      <div style={{ position: 'absolute', inset: 0, opacity: keluar }}>
        {[
          { y: 690, ikon: <IconJam size={84} color={C.kamu} />, teks: 'lama nonton', p: barNonton, w: 820, warna: C.kamu },
          { y: 930, ikon: <IconHati size={84} />, teks: 'like', p: barLike, w: 400, warna: C.kucing },
        ].map((r, i) => (
          <div key={i} style={{ position: 'absolute', left: 90, top: r.y, fontFamily: FONT }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 18 }}>
              {r.ikon}
              <span style={{ fontWeight: 800, fontSize: 52, color: C.text }}>{r.teks}</span>
            </div>
            <div style={{ width: r.w * r.p, height: 56, borderRadius: 99, background: r.warna, boxShadow: `0 0 40px ${r.warna}80` }} />
          </div>
        ))}
      </div>

      <Sfx at={fBerhenti} src="blip" />
      {entri.map((e, i) => (
        <Sfx key={i} at={e.mulai} src="scribble" volume={0.5} />
      ))}
      <Sfx at={fKirim} src="pop" />
      <Sfx at={fSkip + 4} src="skip" />
      <Sfx at={fTapi - 4} src="whoosh" volume={0.4} />
      <Sfx at={fLama + 14} src="ding" volume={0.45} />
    </>
  );
};
