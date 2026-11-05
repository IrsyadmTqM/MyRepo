import React from 'react';
import { siInstagram, siTiktok } from 'simple-icons';
import { C, FONT } from '../theme';

const Logo: React.FC<{ path: string; size: number; bg: string }> = ({ path, size, bg }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.28,
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24">
      <path d={path} fill="#FFFFFF" />
    </svg>
  </div>
);

/** Watermark akun: logo TikTok + Instagram + handle. (x, y) = titik kiri-tengah. */
export const Watermark: React.FC<{
  handle: string;
  x?: number;
  y?: number;
  skala?: number;
  opacity?: number;
  tengah?: boolean;
}> = ({ handle, x = 56, y = 210, skala = 1, opacity = 0.9, tengah = false }) => {
  const s = 40 * skala;
  return (
    <div
      style={{
        position: 'absolute',
        left: tengah ? 0 : x,
        right: tengah ? 0 : undefined,
        top: y,
        display: 'flex',
        justifyContent: tengah ? 'center' : 'flex-start',
        transform: 'translateY(-50%)',
        opacity,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8 * skala,
          padding: `${6 * skala}px ${16 * skala}px ${6 * skala}px ${7 * skala}px`,
          borderRadius: 999,
          background: 'rgba(10, 15, 34, 0.6)',
          border: `${2 * skala}px solid #FFFFFF26`,
        }}
      >
        <Logo path={siTiktok.path} size={s} bg="#000000" />
        <Logo
          path={siInstagram.path}
          size={s}
          bg="linear-gradient(45deg, #FEDA75 0%, #FA7E1E 25%, #D62976 50%, #962FBF 75%, #4F5BD5 100%)"
        />
        <span
          style={{
            marginLeft: 4 * skala,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 30 * skala,
            color: C.text,
            letterSpacing: 0.5,
            whiteSpace: 'nowrap',
          }}
        >
          {handle}
        </span>
      </div>
    </div>
  );
};
