import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Algo } from '../components/Algo';
import { IconCentang, IconHati, IconJam, IconKirim, IconSilang, IkonKategori } from '../components/Icons';
import { Sfx } from '../components/overlays';
import { Label, Phone, Thumb, lerp, maju } from '../components/ui';
import { C, FONT, Kategori } from '../theme';
import { Adegan, frameKata, sedangBicara } from '../timing';

const FEED: Kategori[] = ['bola', 'kucing', 'galau', 'masak', 'robot'];
const PW = 380;
const PH = 700;
const LH = PH - 2 * PW * 0.035; // tinggi layar dalam HP
const BARIS = 76; // tinggi baris di buku catatan

// Tabel perbandingan: 8 video, like cuma di 2, lama nonton di semuanya
const TABEL: { k: Kategori; dtk: string; like: boolean }[] = [
  { k: 'kucing', dtk: '2s', like: false },
  { k: 'masak', dtk: '15s', like: true },
  { k: 'bola', dtk: '0,4s', like: false },
  { k: 'kucing', dtk: '8s', like: false },
  { k: 'robot', dtk: '31s', like: true },
  { k: 'galau', dtk: '1s', like: false },
  { k: 'kucing', dtk: '5s', like: false },
  { k: 'masak', dtk: '12s', like: false },
];
const TX = (i: number) => 255 + i * 98;

type Entri = { mulai: number; ikon: React.ReactNode; teks: string };

export const Sinyal: React.FC<{ a: Adegan }> = ({ a }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fBerhenti = frameKata(a, 'berhenti', 1, 40);
  const fHabis = frameKata(a, 'habis', 1, 65);
  const fLike = frameKata(a, 'like', 1, 75);
  const fKirim = frameKata(a, 'kirim', 1, 85);
  const fSkip = frameKata(a, 'skip', 1, 110);
  const fTapi = frameKata(a, 'tapi', 1, 140);
  const fLike2 = frameKata(a, 'like', 2, 160);
  const fSesekali = frameKata(a, 'sesekali', 1, 180);
  const fLama = frameKata(a, 'lama', 1, 200);
  const fSetiap = frameKata(a, 'setiap', 1, 230);

  // posisi scroll feed (dalam satuan kartu)
  let scroll = interpolate(f, [0, fBerhenti], [0, 1], { extrapolateRight: 'clamp' });
  scroll += maju(f, fSkip, fSkip + 6);
  scroll += maju(f, fSkip + 12, fSkip + 18);
  const progressKucing = maju(f, fBerhenti + 4, fHabis + 6);

  const keluar = maju(f, fTapi - 4, fTapi + 8);

  const entri: Entri[] = [
    { mulai: fBerhenti + 10, ikon: <IconJam size={40} color={C.kamu} />, teks: 'berhenti 2,4 dtk' },
    { mulai: fHabis + 8, ikon: <IconCentang size={40} />, teks: 'nonton sampai habis' },
    { mulai: fLike + 8, ikon: <IconHati size={40} />, teks: 'like' },
    { mulai: fKirim + 8, ikon: <IconKirim size={40} />, teks: 'kirim ke teman' },
    { mulai: fSkip + 14, ikon: <IconSilang size={34} />, teks: 'skip 0,3 dtk' },
  ];
  const menulis = entri.some((e) => f >= e.mulai - 2 && f < e.mulai + 14);

  // chip yang terbang dari HP ke buku catatan
  const chip = (mulai: number, ikon: React.ReactNode, idx: number) => {
    const t = maju(f, mulai - 12, mulai);
    if (f < mulai - 14 || f > mulai + 1) return null;
    const x = lerp(300, 610, t);
    const y = lerp(760, 616 + idx * BARIS, t) - Math.sin(t * Math.PI) * 120;
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
                    <div style={{ position: 'absolute', right: 22, bottom: 170, transform: `scale(${maju(f, fLike, fLike + 8)})` }}>
                      <IconHati size={64} />
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
            height: 478,
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
                  height: BARIS,
                  borderTop: '3px dashed #C5CCE6',
                  opacity: o,
                  transform: `translateX(${(1 - o) * 30}px)`,
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: 99, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {e.ikon}
                </div>
                <span style={{ fontWeight: 700, fontSize: 31, color: C.bg }}>{e.teks}</span>
              </div>
            );
          })}
        </div>
        <Algo x={800} y={1110} scale={0.55} pose="catatan" menulis={menulis} bicara={sedangBicara(a, f)} lihat={{ x: -12, y: -8 }} />
        {entri.map((e, i) => chip(e.mulai, e.ikon, i))}
      </div>

      {/* Tabel: like cuma sesekali, lama nonton di setiap video */}
      <div style={{ position: 'absolute', inset: 0, opacity: keluar }}>
        {TABEL.map((v, i) => {
          const muncul = spring({ frame: f - fTapi - i * 2, fps, config: { damping: 13 } });
          const hati = v.like ? spring({ frame: f - fLike2 - (i === 1 ? 0 : 5), fps, config: { damping: 9 } }) : 0;
          const jam = spring({ frame: f - fLama - i * 3, fps, config: { damping: 11 } });
          return (
            <React.Fragment key={i}>
              <Thumb k={v.k} x={TX(i)} y={640} w={80} h={106} scale={muncul} />
              {/* baris like */}
              <div style={{ position: 'absolute', left: TX(i) - 26, top: 770, opacity: muncul }}>
                <div style={{ position: 'absolute', opacity: 0.18 }}>
                  <IconHati size={52} color={C.muted} />
                </div>
                <div style={{ transform: `scale(${hati})` }}>
                  <IconHati size={52} />
                </div>
              </div>
              {/* baris lama nonton */}
              <div
                style={{
                  position: 'absolute',
                  left: TX(i) - 45,
                  top: 890,
                  width: 90,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transform: `scale(${jam})`,
                  fontFamily: FONT,
                }}
              >
                <IconJam size={48} color={C.kamu} />
                <span style={{ fontWeight: 800, fontSize: 28, color: C.kamu, marginTop: 6 }}>{v.dtk}</span>
              </div>
            </React.Fragment>
          );
        })}
        {/* label baris */}
        <div style={{ position: 'absolute', left: 50, top: 768, opacity: maju(f, fTapi, fTapi + 8), fontFamily: FONT, textAlign: 'center', width: 110 }}>
          <span style={{ fontWeight: 800, fontSize: 30, color: C.kucing }}>like</span>
        </div>
        <div style={{ position: 'absolute', left: 40, top: 900, opacity: maju(f, fTapi, fTapi + 8), fontFamily: FONT, textAlign: 'center', width: 130, lineHeight: 1.1 }}>
          <span style={{ fontWeight: 800, fontSize: 28, color: C.kamu }}>lama nonton</span>
        </div>
        <Label x={330} y={1120} teks="like: sesekali" warna={C.bg} bg={C.kucing} size={38} scale={spring({ frame: f - fSesekali, fps, config: { damping: 12 } })} />
        <Label x={720} y={1120} teks="nonton: tiap video" warna={C.bg} bg={C.kamu} size={38} scale={spring({ frame: f - fSetiap, fps, config: { damping: 12 } })} />
      </div>

      <Sfx at={fBerhenti} src="blip" />
      {entri.map((e, i) => (
        <Sfx key={i} at={e.mulai} src="scribble" volume={0.5} />
      ))}
      <Sfx at={fLike} src="pop" volume={0.45} />
      <Sfx at={fKirim} src="pop" />
      <Sfx at={fSkip + 4} src="skip" />
      <Sfx at={fTapi - 4} src="whoosh" volume={0.4} />
      <Sfx at={fLike2} src="pop" />
      {TABEL.map((_, i) => (
        <Sfx key={`j${i}`} at={fLama + i * 3} src="tick" volume={0.45} />
      ))}
      <Sfx at={fSetiap} src="ding" volume={0.45} />
    </>
  );
};
