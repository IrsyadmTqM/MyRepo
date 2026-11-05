import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { IconOrang } from '../components/Icons';
import { Sfx } from '../components/overlays';
import { Thumb, lerp, maju } from '../components/ui';
import { C, FONT } from '../theme';
import { Adegan, frameKata } from '../timing';

const CX = 540;
const CY = 925;
const CINCIN = [
  { r: 165, n: 8 },
  { r: 260, n: 14 },
  { r: 330, n: 22 },
];

export const Kreator: React.FC<{ a: Adegan }> = ({ a }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fFollower = frameKata(a, 'follower', 1, 15);
  const fSekelompok = frameKata(a, 'sekelompok', 1, 80);
  const fHabis = frameKata(a, 'habis', 1, 120);
  const fSebar = frameKata(a, 'sebar', 1, 140);
  const fLuas = frameKata(a, 'luas', 1, 155);

  const akun = spring({ frame: f, fps, config: { damping: 13 } });
  const unggah = maju(f, 10, 28);
  const sorot = maju(f, fFollower, fFollower + 8) * (1 - maju(f, fSekelompok - 10, fSekelompok));

  const jadwal = [
    { muncul: fSekelompok, nyala: fHabis },
    { muncul: fSebar, nyala: fSebar + 10 },
    { muncul: fLuas - 4, nyala: fLuas + 8 },
  ];

  return (
    <>
      {/* garis dan titik penonton */}
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        {CINCIN.map((c, ci) =>
          Array.from({ length: c.n }, (_, i) => {
            const sudut = (i / c.n) * Math.PI * 2 + ci * 0.3;
            const m = maju(f, jadwal[ci].muncul + i, jadwal[ci].muncul + i + 8);
            const nyala = maju(f, jadwal[ci].nyala + i * 0.7, jadwal[ci].nyala + i * 0.7 + 6);
            return (
              <line
                key={`${ci}-${i}`}
                x1={CX}
                y1={CY}
                x2={CX + Math.cos(sudut) * c.r * m}
                y2={CY + Math.sin(sudut) * c.r * m}
                stroke={nyala > 0.5 ? C.ok : C.panelLine}
                strokeWidth={3}
                opacity={0.6 * m}
              />
            );
          }),
        )}
      </svg>
      {CINCIN.map((c, ci) =>
        Array.from({ length: c.n }, (_, i) => {
          const sudut = (i / c.n) * Math.PI * 2 + ci * 0.3;
          const m = spring({ frame: f - jadwal[ci].muncul - i, fps, config: { damping: 12 } });
          const nyala = maju(f, jadwal[ci].nyala + i * 0.7, jadwal[ci].nyala + i * 0.7 + 6);
          const s = 46 - ci * 6;
          return (
            <div
              key={`${ci}-${i}`}
              style={{
                position: 'absolute',
                left: CX + Math.cos(sudut) * c.r - s / 2,
                top: CY + Math.sin(sudut) * c.r - s / 2,
                transform: `scale(${m})`,
                filter: nyala > 0.5 ? `drop-shadow(0 0 10px ${C.ok})` : undefined,
              }}
            >
              <IconOrang size={s} color={nyala > 0.5 ? C.ok : C.muted} />
            </div>
          );
        }),
      )}

      {/* video baru di tengah */}
      <Thumb
        k="robot"
        x={CX}
        y={lerp(560, CY, unggah)}
        w={150}
        h={200}
        scale={unggah}
        glow={maju(f, fHabis, fHabis + 10)}
      />

      {/* kartu akun */}
      <div
        style={{
          position: 'absolute',
          left: CX,
          top: 520,
          transform: `translate(-50%, -50%) scale(${akun * (1 + sorot * 0.08)})`,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '12px 28px 12px 16px',
          borderRadius: 99,
          background: C.panel,
          border: `4px solid ${sorot > 0.2 ? C.kamu : C.panelLine}`,
          fontFamily: FONT,
          whiteSpace: 'nowrap',
          opacity: 1 - maju(f, fSekelompok, fSekelompok + 10) * 0.4,
        }}
      >
        <div style={{ width: 64, height: 64, borderRadius: 99, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconOrang size={44} color={C.algo} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 36, color: C.text }}>akun baru ·</span>
        <span style={{ fontWeight: 800, fontSize: 36, color: sorot > 0.2 ? C.kamu : C.text }}>0 follower</span>
      </div>

      <Sfx at={10} src="whoosh" volume={0.4} />
      <Sfx at={fFollower} src="blip" />
      {jadwal.map((j, i) => (
        <React.Fragment key={i}>
          <Sfx at={j.muncul} src="pop" volume={0.4} />
          <Sfx at={j.nyala} src="tick" volume={0.5} />
        </React.Fragment>
      ))}
      <Sfx at={fLuas + 14} src="ding" volume={0.4} />
    </>
  );
};
