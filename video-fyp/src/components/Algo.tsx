import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C } from '../theme';
import { IconJam } from './Icons';

export type Pose = 'diam' | 'lambai' | 'stopwatch' | 'catatan';

type Props = {
  x: number;
  y: number;
  scale?: number;
  pose?: Pose;
  bicara?: boolean;
  senang?: boolean;
  menulis?: boolean;
  /** 0 = buku terbuka, 1 = tertutup */
  bukuTutup?: number;
  lihat?: { x: number; y: number };
  opacity?: number;
  rotate?: number;
};

const BADAN = '#1C2650';

const Lengan: React.FC<{ dari: [number, number]; ke: [number, number] }> = ({ dari, ke }) => (
  <g strokeLinecap="round">
    <line x1={dari[0]} y1={dari[1]} x2={ke[0]} y2={ke[1]} stroke={C.algo} strokeWidth={30} />
    <line x1={dari[0]} y1={dari[1]} x2={ke[0]} y2={ke[1]} stroke={BADAN} strokeWidth={16} />
    <circle cx={ke[0]} cy={ke[1]} r={21} fill={BADAN} stroke={C.algo} strokeWidth={7} />
  </g>
);

/** Si Algo: maskot robot narator. Titik tengahnya kira-kira di wajah. */
export const Algo: React.FC<Props> = ({
  x,
  y,
  scale = 1,
  pose = 'diam',
  bicara = false,
  senang = false,
  menulis = false,
  bukuTutup = 0,
  lihat = { x: 0, y: 0 },
  opacity = 1,
  rotate = 0,
}) => {
  const f = useCurrentFrame();
  const melayang = Math.sin(f / 14) * 8;
  const kedip = (f + 17) % 96 < 4;
  const mulut = bicara ? 0.3 + 0.7 * Math.abs(Math.sin(f * 0.85)) * (0.6 + 0.4 * Math.sin(f * 0.37)) : 0;
  const nyala = 0.6 + 0.4 * Math.sin(f / 6);

  const bahuKiri: [number, number] = [118, 335];
  const bahuKanan: [number, number] = [282, 335];
  let tanganKiri: [number, number] = [78, 445];
  let tanganKanan: [number, number] = [322, 445];
  if (pose === 'lambai') {
    tanganKanan = [352 + Math.sin(f / 3.2) * 22, 228];
  }
  if (pose === 'stopwatch') {
    tanganKanan = [345, 268];
  }
  if (pose === 'catatan') {
    tanganKiri = [128, 395];
    tanganKanan = menulis ? [232 + Math.sin(f / 2.2) * 18, 372 + Math.cos(f / 3.1) * 10] : [270, 410];
  }

  const ex = Math.max(-14, Math.min(14, lihat.x));
  const ey = Math.max(-10, Math.min(10, lihat.y));

  return (
    <div
      style={{
        position: 'absolute',
        left: x - 200,
        top: y - 175 + melayang * scale,
        width: 400,
        height: 560,
        transform: `scale(${scale}) rotate(${rotate}deg)`,
        transformOrigin: '200px 175px',
        opacity,
      }}
    >
      <svg width={400} height={560} viewBox="0 0 400 560" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="algo-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C.algo} stopOpacity={0.55} />
            <stop offset="100%" stopColor={C.algo} stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* pendorong / bayangan melayang */}
        <ellipse cx={200} cy={505 - melayang} rx={95 - melayang} ry={22} fill="url(#algo-glow)" opacity={0.9} />

        {/* antena */}
        <line x1={200} y1={72} x2={200} y2={26} stroke={C.algo} strokeWidth={9} strokeLinecap="round" />
        <circle cx={200} cy={22} r={30} fill="url(#algo-glow)" opacity={nyala} />
        <circle cx={200} cy={22} r={13} fill={C.algo} />

        {/* lengan di belakang badan */}
        <Lengan dari={bahuKiri} ke={tanganKiri} />
        {pose !== 'catatan' && <Lengan dari={bahuKanan} ke={tanganKanan} />}

        {/* badan */}
        <rect x={180} y={278} width={40} height={30} fill={BADAN} stroke={C.algo} strokeWidth={6} />
        <rect x={112} y={300} width={176} height={150} rx={44} fill={BADAN} stroke={C.algo} strokeWidth={8} />
        <circle cx={200} cy={368} r={20} fill={C.algo} opacity={nyala} />
        <circle cx={200} cy={368} r={9} fill={C.bg} opacity={0.5} />

        {/* telinga */}
        <rect x={38} y={145} width={28} height={66} rx={12} fill={BADAN} stroke={C.algo} strokeWidth={7} />
        <rect x={334} y={145} width={28} height={66} rx={12} fill={BADAN} stroke={C.algo} strokeWidth={7} />

        {/* kepala */}
        <rect x={60} y={72} width={280} height={210} rx={62} fill={BADAN} stroke={C.algo} strokeWidth={8} />
        <rect x={90} y={104} width={220} height={146} rx={42} fill="#060A16" />

        {/* mata */}
        {senang ? (
          <g stroke={C.algo} strokeWidth={11} strokeLinecap="round" fill="none">
            <path d={`M${136 + ex} ${172 + ey} Q${155 + ex} ${146 + ey} ${174 + ex} ${172 + ey}`} />
            <path d={`M${226 + ex} ${172 + ey} Q${245 + ex} ${146 + ey} ${264 + ex} ${172 + ey}`} />
          </g>
        ) : (
          <g fill={C.algo}>
            <rect x={138 + ex} y={kedip ? 164 + ey : 138 + ey} width={34} height={kedip ? 6 : 54} rx={kedip ? 3 : 17} />
            <rect x={228 + ex} y={kedip ? 164 + ey : 138 + ey} width={34} height={kedip ? 6 : 54} rx={kedip ? 3 : 17} />
          </g>
        )}
        {/* pipi */}
        {senang && (
          <g fill={C.kucing} opacity={0.55}>
            <ellipse cx={122} cy={214} rx={16} ry={9} />
            <ellipse cx={278} cy={214} rx={16} ry={9} />
          </g>
        )}
        {/* mulut */}
        <rect
          x={200 - (bicara ? 24 : 20) + ex * 0.5}
          y={214 - mulut * 10}
          width={bicara ? 48 : 40}
          height={7 + mulut * 22}
          rx={6 + mulut * 8}
          fill={C.algo}
        />

        {/* lengan depan & properti */}
        {pose === 'stopwatch' && (
          <g transform={`translate(${tanganKanan[0] - 48} ${tanganKanan[1] - 118}) rotate(${Math.sin(f / 10) * 6} 48 60)`}>
            <IconJam size={96} color={C.kamu} />
          </g>
        )}
        {pose === 'catatan' && (
          <g>
            <g
              transform={`translate(126 330) rotate(-8) scale(${1 - bukuTutup * 0.5} 1)`}
              style={{ transformOrigin: '0px 0px' }}
            >
              <rect x={0} y={0} width={150} height={118} rx={10} fill="#F4F6FB" />
              <rect x={0} y={0} width={18} height={118} rx={6} fill={C.algo} />
              {bukuTutup < 0.5 &&
                [24, 46, 68, 90].map((yy) => (
                  <line key={yy} x1={32} y1={yy} x2={134} y2={yy} stroke="#B9C2E3" strokeWidth={5} strokeLinecap="round" />
                ))}
            </g>
            <Lengan dari={bahuKanan} ke={tanganKanan} />
            {/* pena */}
            <line
              x1={tanganKanan[0]}
              y1={tanganKanan[1]}
              x2={tanganKanan[0] - 26}
              y2={tanganKanan[1] - 44}
              stroke={C.kamu}
              strokeWidth={10}
              strokeLinecap="round"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
