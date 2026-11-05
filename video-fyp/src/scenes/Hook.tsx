import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { Algo } from '../components/Algo';
import { Sfx } from '../components/overlays';
import { usePop } from '../components/ui';
import { C } from '../theme';
import { Adegan, frameKata, sedangBicara } from '../timing';

export const Hook: React.FC<{ a: Adegan }> = ({ a }) => {
  const f = useCurrentFrame();
  const masuk = usePop(2, 13);
  const x = interpolate(masuk, [0, 1], [1400, 540]);
  const fUkur = frameKata(a, 'ngitung', 1, 40);

  // cincin "radar" yang memindai penonton
  const cincin = [0, 1, 2].map((i) => {
    const t = ((f + i * 20) % 60) / 60;
    return { r: 120 + t * 420, o: (1 - t) * 0.5 };
  });

  return (
    <>
      {cincin.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 540 - c.r,
            top: 930 - c.r,
            width: c.r * 2,
            height: c.r * 2,
            borderRadius: '50%',
            border: `4px solid ${C.danger}`,
            opacity: c.o * masuk,
          }}
        />
      ))}
      <Algo
        x={x}
        y={900}
        scale={1.25}
        pose="stopwatch"
        bicara={sedangBicara(a, f)}
        lihat={{ x: 0, y: f > fUkur ? 8 : 0 }}
        rotate={(1 - masuk) * -12}
      />
      <Sfx at={2} src="whoosh" volume={0.5} />
      {[0, 30, 60, 90, 120, 150].filter((t) => t < a.durationInFrames).map((t) => (
        <Sfx key={t} at={t} src="tick" volume={0.5} />
      ))}
    </>
  );
};
