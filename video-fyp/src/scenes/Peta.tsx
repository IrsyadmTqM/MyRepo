import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { KAMU_AWAL, KAMU_DEKAT_KUCING, PetaDasar, Titik, pulau } from '../components/Peta';
import { Sfx } from '../components/overlays';
import { Thumb, lerp, maju } from '../components/ui';
import { C } from '../theme';
import { Adegan, frameKata } from '../timing';

export const Peta: React.FC<{ a: Adegan }> = ({ a }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fSemua = frameKata(a, 'semua', 1, 6);
  const fKamu = frameKata(a, 'kamu', 1, 45);
  const langkah = [frameKata(a, 'tiap', 1, 70), frameKata(a, 'kucing', 1, 90), frameKata(a, 'geser', 1, 115)];

  // kamera mundur: dari dekat ke jauh
  const zoom = lerp(1.7, 1, maju(f, 0, 24));
  const muncul = (i: number) => spring({ frame: f - fSemua - i * 5, fps, config: { damping: 13 } });

  // titik "kamu" bergeser per langkah
  const t = langkah.reduce((acc, m) => acc + spring({ frame: f - m - 10, fps, config: { damping: 16 } }), 0) / langkah.length;
  const kx = lerp(KAMU_AWAL.x, KAMU_DEKAT_KUCING.x, t);
  const ky = lerp(KAMU_AWAL.y, KAMU_DEKAT_KUCING.y, t);
  const kamuMuncul = spring({ frame: f - fKamu, fps, config: { damping: 10 } });
  const pk = pulau('kucing');

  return (
    <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '540px 850px' }}>
      <PetaDasar muncul={muncul} />
      {/* video kucing yang "ditonton": terbang dari pulau ke titik kamu */}
      {langkah.map((m, i) => {
        const p = maju(f, m, m + 12);
        if (f < m || f > m + 13) return null;
        return (
          <Thumb
            key={i}
            k="kucing"
            x={lerp(pk.x, kx, p)}
            y={lerp(pk.y, ky, p) - Math.sin(p * Math.PI) * 60}
            w={70}
            h={94}
            scale={1 - p * 0.6}
            glow={0.6}
          />
        );
      })}
      <Titik x={kx} y={ky} r={22 * kamuMuncul} warna={C.kamu} cincin={kamuMuncul} label={kamuMuncul > 0.5 ? 'kamu' : undefined} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Sfx key={i} at={fSemua + i * 5} src="pop" volume={0.35} />
      ))}
      <Sfx at={fKamu} src="blip" />
      {langkah.map((m, i) => (
        <Sfx key={`l${i}`} at={m + 10} src="tick" volume={0.6} />
      ))}
    </div>
  );
};
