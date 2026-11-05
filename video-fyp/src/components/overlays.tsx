import React from 'react';
import { Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Adegan, FPS } from '../timing';
import { C, FONT, SAFE } from '../theme';

type Halaman = { mulai: number; akhir: number; kata: { text: string; mulai: number; akhir: number }[] };

/** Susun kata jadi "halaman" subtitle ala Reels: maksimal 4 kata, pecah di tanda baca. */
export const susunSubtitle = (adegan: Adegan[], awal: number[]): Halaman[] => {
  const hasil: Halaman[] = [];
  adegan.forEach((a, i) => {
    const off = awal[i] + a.leadIn;
    let cur: Halaman | null = null;
    a.kata.forEach((k, j) => {
      const m = off + Math.round(k.start * FPS);
      const e = off + Math.round(k.end * FPS);
      if (!cur) cur = { mulai: m, akhir: e, kata: [] };
      cur.kata.push({ text: k.text, mulai: m, akhir: e });
      cur.akhir = e;
      const huruf = cur.kata.reduce((s, x) => s + x.text.length + 1, 0);
      const terakhir = j === a.kata.length - 1;
      if (cur.kata.length >= 4 || /[.,!?:;…]$/.test(k.text) || huruf > 20 || terakhir) {
        hasil.push(cur);
        cur = null;
      }
    });
  });
  // tiap halaman tampil sampai halaman berikutnya mulai (maks 0,6 dtk setelah kata terakhir)
  hasil.forEach((h, i) => {
    const next = hasil[i + 1];
    h.akhir = Math.min(next ? next.mulai : h.akhir + 18, h.akhir + 18);
  });
  return hasil;
};

export const Subtitle: React.FC<{ halaman: Halaman[] }> = ({ halaman }) => {
  const f = useCurrentFrame();
  const h = halaman.find((x) => f >= x.mulai && f < x.akhir);
  if (!h) return null;
  const masuk = interpolate(f - h.mulai, [0, 4], [0.9, 1], { extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute',
        top: SAFE.captionY,
        left: 90,
        right: 130,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0 18px',
        transform: `scale(${masuk})`,
      }}
    >
      {h.kata.map((k, i) => {
        const aktif = f >= k.mulai && f < Math.max(k.akhir, k.mulai + 2);
        const sudah = f > k.akhir;
        return (
          <span
            key={i}
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 66,
              lineHeight: 1.25,
              color: aktif ? C.kamu : sudah ? C.text : '#FFFFFFB0',
              transform: aktif ? 'scale(1.08)' : 'scale(1)',
              display: 'inline-block',
              textShadow: '0 4px 0 #000, 0 0 18px #000000c0',
              WebkitTextStroke: '2px #00000080',
            }}
          >
            {k.text}
          </span>
        );
      })}
    </div>
  );
};

const format = (frames: number) => {
  const totalCs = Math.max(0, Math.floor((frames / FPS) * 100));
  const m = Math.floor(totalCs / 6000);
  const s = Math.floor((totalCs % 6000) / 100);
  const cs = totalCs % 100;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
};

/** Timer global: membesar saat ditekankan (0 = kecil di atas, 1 = besar). */
export const Timer: React.FC<{ nilai: number; tekan: number; berhenti?: boolean }> = ({ nilai, tekan, berhenti }) => {
  const f = useCurrentFrame();
  const size = interpolate(tekan, [0, 1], [42, 132]);
  const y = interpolate(tekan, [0, 1], [SAFE.timerY, 560]);
  const kedip = berhenti && Math.floor(f / 8) % 2 === 0;
  const warna = berhenti ? (kedip ? C.kamu : C.text) : C.text;
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        transform: 'translateY(-50%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: size * 0.3,
          padding: `${size * 0.16}px ${size * 0.45}px`,
          borderRadius: 999,
          background: `rgba(10, 15, 34, ${0.75 - tekan * 0.35})`,
          border: `${2 + tekan * 3}px solid ${berhenti ? C.kamu : C.danger}`,
          boxShadow: tekan > 0.3 ? `0 0 ${50 * tekan}px ${C.danger}55` : undefined,
        }}
      >
        <div
          style={{
            width: size * 0.32,
            height: size * 0.32,
            borderRadius: 99,
            background: berhenti ? C.kamu : C.danger,
            opacity: berhenti ? 1 : 0.55 + 0.45 * Math.sin(f / 4),
          }}
        />
        <span
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: size,
            color: warna,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: size * 0.02,
          }}
        >
          {format(nilai)}
        </span>
      </div>
    </div>
  );
};

/** Efek suara pendek di frame tertentu (relatif ke Sequence induk). */
export const Sfx: React.FC<{ at: number; src: string; volume?: number }> = ({ at, src, volume = 0.6 }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={45} layout="none">
    <Html5Audio src={staticFile(`sfx/${src}.wav`)} volume={volume} />
  </Sequence>
);
