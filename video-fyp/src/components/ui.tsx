import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT, Kategori, SAFE, W } from '../theme';
import { IkonKategori } from './Icons';

/** Nilai 0→1 dengan efek pegas, mulai di frame `mulai`. */
export const usePop = (mulai: number, damping = 14) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - mulai, fps, config: { damping, mass: 0.7 } });
};

/** Nilai 0→1 linear-halus antara frame a dan b. */
export const maju = (f: number, a: number, b: number, ease = Easing.inOut(Easing.cubic)) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const Thumb: React.FC<{
  k: Kategori;
  x: number;
  y: number;
  w?: number;
  h?: number;
  scale?: number;
  opacity?: number;
  rotate?: number;
  glow?: number;
  progress?: number;
  children?: React.ReactNode;
}> = ({ k, x, y, w = 120, h = 160, scale = 1, opacity = 1, rotate = 0, glow = 0, progress, children }) => {
  const warna = C[k];
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        borderRadius: Math.min(w, h) * 0.16,
        background: `linear-gradient(160deg, ${warna}40, ${warna}18)`,
        border: `${Math.max(3, w * 0.03)}px solid ${warna}`,
        transform: `scale(${scale}) rotate(${rotate}deg)`,
        opacity,
        boxShadow: glow > 0 ? `0 0 ${60 * glow}px ${warna}` : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <IkonKategori k={k} size={Math.min(w, h) * 0.55} />
      {progress !== undefined && (
        <div
          style={{
            position: 'absolute',
            left: '8%',
            right: '8%',
            bottom: '7%',
            height: Math.max(6, h * 0.035),
            borderRadius: 99,
            background: '#ffffff30',
          }}
        >
          <div
            style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 99, background: C.text }}
          />
        </div>
      )}
      {children}
    </div>
  );
};

export const Phone: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  scale?: number;
  opacity?: number;
  rotate?: number;
  label?: string;
  children?: React.ReactNode;
}> = ({ x, y, w = 420, h = 780, scale = 1, opacity = 1, rotate = 0, label, children }) => (
  <div
    style={{
      position: 'absolute',
      left: x - w / 2,
      top: y - h / 2,
      width: w,
      height: h,
      borderRadius: w * 0.13,
      border: `${w * 0.035}px solid #2B3770`,
      background: '#070B18',
      boxShadow: '0 30px 80px #00000080',
      transform: `scale(${scale}) rotate(${rotate}deg)`,
      opacity,
      overflow: 'hidden',
    }}
  >
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>{children}</div>
    <div
      style={{
        position: 'absolute',
        top: w * 0.03,
        left: '50%',
        width: w * 0.28,
        height: w * 0.06,
        marginLeft: -w * 0.14,
        borderRadius: 99,
        background: '#2B3770',
      }}
    />
    {label && (
      <div
        style={{
          position: 'absolute',
          top: w * 0.12,
          width: '100%',
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: w * 0.12,
          color: C.text,
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
    )}
  </div>
);

/** Judul besar di atas layar (teks pendek tiap adegan). */
export const Headline: React.FC<{
  teks: string;
  mulai?: number;
  akhir?: number;
  warna?: string;
  y?: number;
  size?: number;
}> = ({ teks, mulai = 0, akhir = 1e9, warna = C.kamu, y = SAFE.headlineY, size }) => {
  const f = useCurrentFrame();
  const p = usePop(mulai, 12) * (1 - maju(f, akhir - 16, akhir - 8));
  // ukuran otomatis supaya selalu 1 baris
  const ukuran = size ?? (teks.length <= 21 ? 76 : Math.floor((76 * 21) / teks.length));
  if (!teks) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: 60,
        right: 60,
        textAlign: 'center',
        transform: `translateY(${(1 - p) * 30}px) scale(${0.85 + 0.15 * p})`,
        opacity: p,
      }}
    >
      <span
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: ukuran,
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
          color: C.bg,
          background: warna,
          padding: '10px 28px 14px',
          borderRadius: 22,
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
        }}
      >
        {teks}
      </span>
    </div>
  );
};

export const Sumber: React.FC<{ teks?: string; mulai?: number }> = ({ teks, mulai = 0 }) => {
  const f = useCurrentFrame();
  if (!teks) return null;
  const o = maju(f, mulai, mulai + 12);
  return (
    <div
      style={{
        position: 'absolute',
        top: SAFE.sumberY,
        left: 80,
        right: 140,
        textAlign: 'center',
        fontFamily: FONT,
        fontWeight: 500,
        fontSize: 26,
        color: C.muted,
        opacity: o * 0.9,
      }}
    >
      sumber: {teks}
    </div>
  );
};

export const Label: React.FC<{
  x: number;
  y: number;
  teks: string;
  warna?: string;
  size?: number;
  opacity?: number;
  scale?: number;
  bg?: string;
}> = ({ x, y, teks, warna = C.text, size = 34, opacity = 1, scale = 1, bg }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${scale})`,
      fontFamily: FONT,
      fontWeight: 800,
      fontSize: size,
      color: warna,
      whiteSpace: 'nowrap',
      opacity,
      background: bg,
      padding: bg ? '6px 18px 8px' : undefined,
      borderRadius: bg ? 99 : undefined,
    }}
  >
    {teks}
  </div>
);

export const Latar: React.FC = () => {
  const f = useCurrentFrame();
  const geser = (f * 0.4) % 60;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 40%, ${C.bg2} 0%, ${C.bg} 70%)` }}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${C.panelLine} 2px, transparent 2.5px)`,
          backgroundSize: '60px 60px',
          backgroundPosition: `0px ${geser}px`,
          opacity: 0.45,
        }}
      />
      <AbsoluteFill style={{ background: 'radial-gradient(90% 60% at 50% 50%, transparent 55%, #000000a0 100%)' }} />
    </AbsoluteFill>
  );
};

export const lebar = W;
