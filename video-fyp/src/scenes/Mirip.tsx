import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { KAMU_AKHIR, KAMU_DEKAT_KUCING, PetaDasar, TETANGGA, Titik, pulau } from '../components/Peta';
import { Sfx } from '../components/overlays';
import { Thumb, lerp, maju } from '../components/ui';
import { C } from '../theme';
import { Adegan, frameKata } from '../timing';

export const Mirip: React.FC<{ a: Adegan }> = ({ a }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fOrang = frameKata(a, 'orang-orang', 1, 20);
  const fRobot = frameKata(a, 'robot', 1, 60);
  const fKemungkinan = frameKata(a, 'kemungkinan', 1, 90);

  const pr = pulau('robot');
  const tKamu = spring({ frame: f - fKemungkinan - 14, fps, config: { damping: 15 } });
  const kx = lerp(KAMU_DEKAT_KUCING.x, KAMU_AKHIR.x, tKamu);
  const ky = lerp(KAMU_DEKAT_KUCING.y, KAMU_AKHIR.y, tKamu);
  const garis = maju(f, fKemungkinan, fKemungkinan + 14);
  const terbang = maju(f, fKemungkinan + 4, fKemungkinan + 18);

  return (
    <>
      <PetaDasar muncul={() => 1} orangLain={0.6} nyala={f > fRobot ? 'robot' : undefined} />
      {/* garis rekomendasi dari pulau robot ke kamu */}
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <line
          x1={pr.x}
          y1={pr.y}
          x2={lerp(pr.x, kx, garis)}
          y2={lerp(pr.y, ky, garis)}
          stroke={C.algo}
          strokeWidth={8}
          strokeDasharray="18 16"
          strokeLinecap="round"
          strokeDashoffset={-f * 2}
          opacity={garis > 0 ? 1 : 0}
        />
      </svg>
      {TETANGGA.map((t, i) => {
        const muncul = spring({ frame: f - fOrang - i * 3, fps, config: { damping: 11 } });
        const pindah = spring({ frame: f - fRobot - i * 3, fps, config: { damping: 16 } });
        const x = lerp(KAMU_DEKAT_KUCING.x + t.dx, pr.x + t.dx * 0.7, pindah);
        const y = lerp(KAMU_DEKAT_KUCING.y + t.dy, pr.y - 30 + t.dy * 0.5, pindah);
        return <Titik key={i} x={x} y={y} r={14} warna={C.algo} opacity={muncul} cincin={muncul * (1 - pindah * 0.7)} />;
      })}
      {terbang > 0 && terbang < 1 && (
        <Thumb
          k="robot"
          x={lerp(pr.x, kx, terbang)}
          y={lerp(pr.y, ky, terbang) - Math.sin(terbang * Math.PI) * 80}
          w={80}
          h={106}
          glow={0.8}
          scale={1 - terbang * 0.4}
        />
      )}
      <Titik x={kx} y={ky} r={22} warna={C.kamu} cincin={1} label="kamu" />
      {TETANGGA.map((_, i) => (
        <Sfx key={i} at={fOrang + i * 3} src="tick" volume={0.4} />
      ))}
      <Sfx at={fRobot} src="whoosh" volume={0.4} />
      <Sfx at={fKemungkinan + 14} src="ding" volume={0.4} />
    </>
  );
};
