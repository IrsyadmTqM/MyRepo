import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Algo } from '../components/Algo';
import { Sfx } from '../components/overlays';
import { Label, Phone, Thumb, lerp, maju } from '../components/ui';
import { C, FONT } from '../theme';
import { Adegan, frameKata, sedangBicara } from '../timing';

const PX = 520;
const PY = 860;
const PW = 420;
const PH = 760;
const BORDER = PW * 0.035;
const SEL = [
  { x: 100, y: 140 },
  { x: 290, y: 140 },
  { x: 100, y: 365 },
  { x: 290, y: 365 },
  { x: 100, y: 590 },
  { x: 290, y: 590 },
];
const SISIPAN = 2; // sel yang diganti video "ujian"

export const Ujian: React.FC<{ a: Adegan }> = ({ a }) => {
  const f = useCurrentFrame();
  const fSelipin = frameKata(a, 'selipin', 1, 15);
  const fTonton = frameKata(a, 'tonton', 1, 70);
  const fHabis = frameKata(a, 'habis', 1, 90);
  const fBerubah = frameKata(a, 'berubah', 1, 115);

  const terbang = maju(f, fSelipin, fSelipin + 16);
  const target = { x: PX - PW / 2 + BORDER + SEL[SISIPAN].x, y: PY - PH / 2 + BORDER + SEL[SISIPAN].y };
  const progress = maju(f, fTonton, fHabis + 8);

  return (
    <>
      <Phone x={PX} y={PY} w={PW} h={PH}>
        {SEL.map((s, i) => {
          const sisipan = i === SISIPAN;
          if (sisipan && terbang < 1) return null;
          // kartu lain berbalik jadi "masak" satu per satu
          const mulaiBalik = fBerubah + i * 4;
          const balik = maju(f, mulaiBalik, mulaiBalik + 8);
          const sx = Math.abs(Math.cos(balik * Math.PI));
          const k = sisipan || balik > 0.5 ? 'masak' : 'kucing';
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                transform: `scaleX(${sisipan ? 1 : sx})`,
                transformOrigin: `${s.x}px ${s.y}px`,
              }}
            >
              <Thumb
                k={k}
                x={s.x}
                y={s.y}
                w={170}
                h={210}
                glow={sisipan ? 0.5 * (1 - balik) : 0}
                progress={sisipan ? progress : undefined}
              />
            </div>
          );
        })}
      </Phone>

      {/* tanda "?" pada video ujian */}
      {terbang >= 1 && f < fBerubah && (
        <Label x={target.x + 70} y={target.y - 90} teks="?" warna={C.bg} bg={C.kamu} size={44} scale={maju(f, fSelipin + 16, fSelipin + 22)} />
      )}

      {/* video masak yang diselipkan Algo */}
      {terbang > 0 && terbang < 1 && (
        <Thumb
          k="masak"
          x={lerp(860, target.x, terbang)}
          y={lerp(1040, target.y, terbang) - Math.sin(terbang * Math.PI) * 140}
          w={170}
          h={210}
          rotate={(1 - terbang) * 25}
          glow={0.6}
        />
      )}

      <Algo x={880} y={1095} scale={0.55} pose={f < fSelipin + 10 ? 'lambai' : 'diam'} bicara={sedangBicara(a, f)} lihat={{ x: -14, y: -6 }} />

      <div
        style={{
          position: 'absolute',
          left: 80,
          top: 1210,
          width: 880,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 38,
          color: C.muted,
          opacity: maju(f, fBerubah + 6, fBerubah + 14),
        }}
      >
        FYP: <span style={{ color: C.kucing }}>kucing</span> → <span style={{ color: C.masak }}>masak</span>
      </div>

      <Sfx at={fSelipin} src="whoosh" volume={0.5} />
      <Sfx at={fSelipin + 16} src="pop" />
      <Sfx at={fHabis + 8} src="blip" />
      {SEL.map((_, i) => (
        <Sfx key={i} at={fBerubah + i * 4 + 4} src="tick" volume={0.45} />
      ))}
    </>
  );
};
