import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Algo } from '../components/Algo';
import { Sfx } from '../components/overlays';
import { maju, usePop } from '../components/ui';
import { Adegan, frameKata, sedangBicara } from '../timing';

export const Penutup: React.FC<{ a: Adegan }> = ({ a }) => {
  const f = useCurrentFrame();
  const fSelamat = frameKata(a, 'selamat', 1, 40);
  const fKetemu = frameKata(a, 'ketemu', 1, 110);
  const masuk = usePop(0, 13);
  const tutup = maju(f, fSelamat, fSelamat + 10);
  const pudar = maju(f, a.durationInFrames - 14, a.durationInFrames - 2);

  return (
    <>
      <Algo
        x={540}
        y={900}
        scale={1.15 * masuk}
        pose={f >= fKetemu ? 'lambai' : 'catatan'}
        bukuTutup={tutup}
        senang={f >= fSelamat}
        bicara={sedangBicara(a, f)}
        opacity={1 - pudar}
      />
      <Sfx at={fSelamat} src="pop" />
      <Sfx at={fSelamat + 4} src="ding" volume={0.45} />
      <Sfx at={fKetemu} src="blip" volume={0.4} />
    </>
  );
};
