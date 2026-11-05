import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Algo } from '../components/Algo';
import { IconCentang } from '../components/Icons';
import { KAMU_DEKAT_KUCING, PetaDasar, Titik } from '../components/Peta';
import { Sfx } from '../components/overlays';
import { maju, usePop } from '../components/ui';
import { C } from '../theme';
import { Adegan, frameKata, sedangBicara } from '../timing';

export const MasihDiSini: React.FC<{ a: Adegan }> = ({ a }) => {
  const f = useCurrentFrame();
  const fCatat = frameKata(a, 'catat', 1, 35);
  const redup = maju(f, 0, 8) * (1 - maju(f, a.durationInFrames - 8, a.durationInFrames));
  const algo = usePop(2, 12);
  const cap = usePop(fCatat, 9);

  return (
    <>
      <PetaDasar muncul={() => 1} />
      <Titik x={KAMU_DEKAT_KUCING.x} y={KAMU_DEKAT_KUCING.y} r={22} warna={C.kamu} cincin={1} label="kamu" />
      <div style={{ position: 'absolute', inset: 0, background: C.bg, opacity: 0.75 * redup }} />
      <Algo x={540} y={930} scale={0.9 * algo} pose="catatan" menulis={f < fCatat + 10} bicara={sedangBicara(a, f)} opacity={algo} />
      <div
        style={{
          position: 'absolute',
          left: 700,
          top: 760,
          transform: `scale(${cap}) rotate(-12deg)`,
          width: 170,
          height: 170,
          borderRadius: 99,
          border: `8px solid ${C.ok}`,
          background: `${C.bg}cc`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconCentang size={110} />
      </div>
      <Sfx at={2} src="scribble" volume={0.5} />
      <Sfx at={fCatat} src="blip" />
    </>
  );
};
