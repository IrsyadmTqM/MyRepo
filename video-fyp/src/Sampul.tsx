import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Algo } from './components/Algo';
import { Latar } from './components/ui';
import naskah from './naskah.json';
import { C, FONT, loadFonts } from './theme';

loadFonts();

/** Gambar sampul (cover) Reels. Teks penting ada di area tengah 3:4 supaya aman di grid profil. */
export const Sampul: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Latar />
    <div style={{ position: 'absolute', top: 330, left: 60, right: 60, textAlign: 'center', fontFamily: FONT }}>
      {naskah.sampul.map((baris, i) => (
        <div
          key={i}
          style={{
            fontWeight: 800,
            fontSize: i === 0 ? 96 : 116,
            lineHeight: 1.12,
            color: i === 0 ? C.text : C.kamu,
            textShadow: '0 6px 0 #000',
          }}
        >
          {baris}
        </div>
      ))}
    </div>
    <Algo x={540} y={1060} scale={1.45} pose="stopwatch" lihat={{ x: 0, y: 6 }} />
  </AbsoluteFill>
);
