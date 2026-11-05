import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Algo } from '../components/Algo';
import { IconPlay } from '../components/Icons';
import { Sfx } from '../components/overlays';
import { Phone, usePop } from '../components/ui';
import { C } from '../theme';
import { Adegan, frameKata, sedangBicara } from '../timing';

const LayarFeed: React.FC<{ warna: string }> = ({ warna }) => (
  <div
    style={{
      position: 'absolute',
      inset: '22% 10% 10%',
      borderRadius: 24,
      background: `linear-gradient(160deg, ${warna}55, ${warna}15)`,
      border: `4px solid ${warna}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <IconPlay size={70} color={warna} />
  </div>
);

export const Kenalan: React.FC<{ a: Adegan }> = ({ a }) => {
  const f = useCurrentFrame();
  const fTiktok = frameKata(a, 'tiktok', 1, 30);
  const fIg = frameKata(a, 'instagram', 1, 50);
  const fMirip = frameKata(a, 'mirip', 1, 80);
  const p1 = usePop(fTiktok, 12);
  const p2 = usePop(fIg, 12);
  const goyang = f > fMirip ? Math.sin((f - fMirip) / 3) * 4 : 0;

  return (
    <>
      <Phone x={235} y={800} w={300} h={540} scale={p1} rotate={-8} label="FYP">
        <LayarFeed warna={C.kucing} />
      </Phone>
      <Phone x={845} y={800} w={300} h={540} scale={p2} label="Reels">
        <LayarFeed warna={C.masak} />
      </Phone>
      <div style={{ position: 'absolute', inset: 0, transform: `rotate(${goyang}deg)`, transformOrigin: '540px 900px' }}>
        <Algo x={540} y={860} scale={1.05} pose={f < fTiktok ? 'lambai' : 'diam'} senang={f < fTiktok} bicara={sedangBicara(a, f)} />
      </div>
      <Sfx at={fTiktok} src="pop" />
      <Sfx at={fIg} src="pop" />
      <Sfx at={4} src="blip" volume={0.4} />
    </>
  );
};
