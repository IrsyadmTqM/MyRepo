import React from 'react';
import { C, Kategori } from '../theme';

type P = { size?: number; color?: string; style?: React.CSSProperties };

const Svg: React.FC<P & { children: React.ReactNode }> = ({ size = 80, style, children }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible', ...style }}>
    {children}
  </svg>
);

export const IconKucing: React.FC<P> = ({ color = C.kucing, ...p }) => (
  <Svg {...p}>
    <path d="M18 42 L22 12 L42 30 Q50 27 58 30 L78 12 L82 42 Q88 78 50 84 Q12 78 18 42 Z" fill={color} />
    <ellipse cx="37" cy="52" rx="5" ry="7" fill={C.bg} />
    <ellipse cx="63" cy="52" rx="5" ry="7" fill={C.bg} />
    <path d="M46 64 L54 64 L50 69 Z" fill={C.bg} />
    <g stroke={C.bg} strokeWidth="2.5" strokeLinecap="round">
      <line x1="28" y1="66" x2="8" y2="62" />
      <line x1="28" y1="71" x2="9" y2="74" />
      <line x1="72" y1="66" x2="92" y2="62" />
      <line x1="72" y1="71" x2="91" y2="74" />
    </g>
  </Svg>
);

export const IconMasak: React.FC<P> = ({ color = C.masak, ...p }) => (
  <Svg {...p}>
    <g stroke={color} strokeWidth="5" strokeLinecap="round" fill="none">
      <path d="M38 12 Q32 20 38 28 Q44 36 38 42" />
      <path d="M54 8 Q48 18 54 26 Q60 34 54 42" />
    </g>
    <ellipse cx="46" cy="64" rx="34" ry="20" fill={color} />
    <ellipse cx="46" cy="60" rx="26" ry="12" fill={C.bg} opacity="0.35" />
    <rect x="76" y="58" width="22" height="9" rx="4.5" fill={color} />
  </Svg>
);

export const IconBola: React.FC<P> = ({ color = C.bola, ...p }) => (
  <Svg {...p}>
    <circle cx="50" cy="50" r="38" fill={color} />
    <path d="M50 34 L64 44 L59 61 L41 61 L36 44 Z" fill={C.bg} />
    <g stroke={C.bg} strokeWidth="4" strokeLinecap="round">
      <line x1="50" y1="34" x2="50" y2="13" />
      <line x1="64" y1="44" x2="85" y2="38" />
      <line x1="59" y1="61" x2="72" y2="80" />
      <line x1="41" y1="61" x2="28" y2="80" />
      <line x1="36" y1="44" x2="15" y2="38" />
    </g>
  </Svg>
);

export const IconGalau: React.FC<P> = ({ color = C.galau, ...p }) => (
  <Svg {...p}>
    <path
      d="M26 62 Q10 62 12 48 Q14 36 28 38 Q30 20 50 20 Q68 20 72 36 Q90 34 90 50 Q90 62 76 62 Z"
      fill={color}
    />
    <g fill={color}>
      <path d="M32 72 Q28 80 32 84 Q36 80 32 72 Z" />
      <path d="M52 74 Q48 82 52 86 Q56 82 52 74 Z" />
      <path d="M70 70 Q66 78 70 82 Q74 78 70 70 Z" />
    </g>
  </Svg>
);

export const IconRobot: React.FC<P> = ({ color = C.robot, ...p }) => (
  <Svg {...p}>
    <line x1="50" y1="8" x2="50" y2="22" stroke={color} strokeWidth="5" strokeLinecap="round" />
    <circle cx="50" cy="8" r="6" fill={color} />
    <rect x="16" y="22" width="68" height="56" rx="16" fill={color} />
    <rect x="26" y="34" width="48" height="30" rx="10" fill={C.bg} />
    <rect x="34" y="42" width="9" height="13" rx="4" fill={color} />
    <rect x="57" y="42" width="9" height="13" rx="4" fill={color} />
    <rect x="6" y="40" width="10" height="20" rx="5" fill={color} />
    <rect x="84" y="40" width="10" height="20" rx="5" fill={color} />
  </Svg>
);

export const IkonKategori: React.FC<P & { k: Kategori }> = ({ k, ...p }) => {
  switch (k) {
    case 'kucing':
      return <IconKucing {...p} />;
    case 'masak':
      return <IconMasak {...p} />;
    case 'bola':
      return <IconBola {...p} />;
    case 'galau':
      return <IconGalau {...p} />;
    case 'robot':
      return <IconRobot {...p} />;
  }
};

export const IconHati: React.FC<P> = ({ color = C.kucing, ...p }) => (
  <Svg {...p}>
    <path d="M50 86 L16 52 Q2 36 16 22 Q32 8 50 28 Q68 8 84 22 Q98 36 84 52 Z" fill={color} />
  </Svg>
);

export const IconKirim: React.FC<P> = ({ color = C.algo, ...p }) => (
  <Svg {...p}>
    <path d="M8 46 L92 10 L66 90 L48 58 Z" fill={color} />
    <path d="M48 58 L92 10" stroke={C.bg} strokeWidth="5" strokeLinecap="round" />
  </Svg>
);

export const IconSilang: React.FC<P> = ({ color = C.danger, ...p }) => (
  <Svg {...p}>
    <g stroke={color} strokeWidth="14" strokeLinecap="round">
      <line x1="22" y1="22" x2="78" y2="78" />
      <line x1="78" y1="22" x2="22" y2="78" />
    </g>
  </Svg>
);

export const IconCentang: React.FC<P> = ({ color = C.ok, ...p }) => (
  <Svg {...p}>
    <path d="M16 52 L40 76 L86 26" stroke={color} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

export const IconJam: React.FC<P> = ({ color = C.algo, ...p }) => (
  <Svg {...p}>
    <rect x="42" y="2" width="16" height="10" rx="3" fill={color} />
    <circle cx="50" cy="56" r="38" fill="none" stroke={color} strokeWidth="9" />
    <line x1="50" y1="56" x2="50" y2="32" stroke={color} strokeWidth="8" strokeLinecap="round" />
    <line x1="50" y1="56" x2="66" y2="64" stroke={color} strokeWidth="8" strokeLinecap="round" />
  </Svg>
);

export const IconOrang: React.FC<P> = ({ color = C.muted, ...p }) => (
  <Svg {...p}>
    <circle cx="50" cy="32" r="20" fill={color} />
    <path d="M14 92 Q14 58 50 58 Q86 58 86 92 Z" fill={color} />
  </Svg>
);

export const IconPlay: React.FC<P> = ({ color = C.text, ...p }) => (
  <Svg {...p}>
    <path d="M30 18 L82 50 L30 82 Z" fill={color} />
  </Svg>
);
