import React from 'react';
import { random } from 'remotion';
import { C, FONT, Kategori } from '../theme';
import { Thumb } from './ui';

export type Pulau = { k: Kategori; x: number; y: number; label: string };

export const PULAU: Pulau[] = [
  { k: 'kucing', x: 290, y: 625, label: 'kucing' },
  { k: 'masak', x: 800, y: 615, label: 'masak' },
  { k: 'bola', x: 225, y: 985, label: 'bola' },
  { k: 'robot', x: 535, y: 1065, label: 'robot' },
  { k: 'galau', x: 835, y: 990, label: 'galau' },
];
export const pulau = (k: Kategori) => PULAU.find((p) => p.k === k)!;

/** Posisi titik "kamu" di peta. */
export const KAMU_AWAL = { x: 560, y: 830 };
export const KAMU_DEKAT_KUCING = { x: 440, y: 715 };
export const KAMU_AKHIR = { x: 470, y: 810 };

/** Titik-titik pengguna lain (abu-abu). */
export const ORANG_LAIN = Array.from({ length: 34 }, (_, i) => ({
  x: 100 + random(`ox${i}`) * 880,
  y: 520 + random(`oy${i}`) * 660,
}));

/** Tetangga = orang yang posisinya dekat "kamu" (dipakai di adegan "mirip"). */
export const TETANGGA = [
  { dx: -85, dy: -45 },
  { dx: 70, dy: -65 },
  { dx: 95, dy: 35 },
  { dx: -60, dy: 70 },
  { dx: 15, dy: 105 },
];

const OFFSET = [
  [-70, -50],
  [0, -70],
  [70, -50],
  [-70, 40],
  [0, 20],
  [70, 40],
];

export const PulauView: React.FC<{ p: Pulau; muncul: number; nyala?: number }> = ({ p, muncul, nyala = 0 }) => (
  <>
    <div
      style={{
        position: 'absolute',
        left: p.x - 170,
        top: p.y - 150,
        width: 340,
        height: 300,
        borderRadius: '50%',
        background: `radial-gradient(closest-side, ${C[p.k]}${nyala > 0 ? '55' : '30'}, transparent)`,
        transform: `scale(${muncul})`,
      }}
    />
    {OFFSET.map(([dx, dy], i) => (
      <Thumb
        key={i}
        k={p.k}
        x={p.x + dx}
        y={p.y + dy}
        w={58}
        h={78}
        scale={muncul}
        rotate={(random(`${p.k}${i}`) - 0.5) * 16}
      />
    ))}
    <div
      style={{
        position: 'absolute',
        left: p.x,
        top: p.y + 112,
        transform: `translate(-50%, -50%) scale(${muncul})`,
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 32,
        color: C.bg,
        background: C[p.k],
        padding: '4px 18px 6px',
        borderRadius: 99,
      }}
    >
      {p.label}
    </div>
  </>
);

export const Titik: React.FC<{
  x: number;
  y: number;
  warna?: string;
  r?: number;
  opacity?: number;
  cincin?: number;
  label?: string;
}> = ({ x, y, warna = C.muted, r = 12, opacity = 1, cincin = 0, label }) => (
  <>
    {cincin > 0 && (
      <div
        style={{
          position: 'absolute',
          left: x - r * 2.6,
          top: y - r * 2.6,
          width: r * 5.2,
          height: r * 5.2,
          borderRadius: '50%',
          border: `4px solid ${warna}`,
          opacity: cincin * opacity,
          transform: `scale(${0.6 + 0.4 * cincin})`,
        }}
      />
    )}
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        background: warna,
        opacity,
        boxShadow: r > 14 ? `0 0 ${r * 2.5}px ${warna}` : undefined,
      }}
    />
    {label && (
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y - r - 34,
          transform: 'translateX(-50%)',
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 36,
          color: warna,
          opacity,
          textShadow: '0 3px 0 #000',
        }}
      >
        {label}
      </div>
    )}
  </>
);

/** Peta minat dasar: pulau-pulau + titik orang lain. */
export const PetaDasar: React.FC<{ muncul: (i: number) => number; orangLain?: number; nyala?: Kategori }> = ({
  muncul,
  orangLain = 1,
  nyala,
}) => (
  <>
    {ORANG_LAIN.map((o, i) => (
      <Titik key={i} x={o.x} y={o.y} r={8} opacity={0.5 * orangLain} />
    ))}
    {PULAU.map((p, i) => (
      <PulauView key={p.k} p={p} muncul={muncul(i)} nyala={nyala === p.k ? 1 : 0} />
    ))}
  </>
);
