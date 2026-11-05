import React, { useMemo } from 'react';
import { AbsoluteFill, Html5Audio, Sequence, Series, interpolate, useCurrentFrame } from 'remotion';
import { Subtitle, Timer, susunSubtitle } from './components/overlays';
import { Headline, Latar, Sumber } from './components/ui';
import { Watermark } from './components/Watermark';
import naskah from './naskah.json';
import { Hook } from './scenes/Hook';
import { Kenalan } from './scenes/Kenalan';
import { Kreator } from './scenes/Kreator';
import { MasihDiSini } from './scenes/MasihDiSini';
import { Mirip } from './scenes/Mirip';
import { Penutup } from './scenes/Penutup';
import { Peta } from './scenes/Peta';
import { Sinyal } from './scenes/Sinyal';
import { Turnamen } from './scenes/Turnamen';
import { Ujian } from './scenes/Ujian';
import { C, loadFonts } from './theme';
import { Adegan, Props, frameKata } from './timing';

loadFonts();

type Def = {
  Komponen: React.FC<{ a: Adegan }>;
  judulMulai?: (a: Adegan) => number;
  warnaJudul?: string;
  judulY?: number;
  sumberMulai?: (a: Adegan) => number;
};

/** Daftar adegan: id harus sama dengan id di naskah.json */
const ADEGAN: Record<string, Def> = {
  hook: { Komponen: Hook, judulMulai: () => 0, warnaJudul: C.danger },
  kenalan: { Komponen: Kenalan, judulMulai: (a) => frameKata(a, 'algoritma', 1, 10), warnaJudul: C.algo },
  sinyal: { Komponen: Sinyal, judulMulai: () => 6, sumberMulai: (a) => frameKata(a, 'tapi', 1, 150) + 8 },
  peta: { Komponen: Peta, judulMulai: (a) => frameKata(a, 'peta', 1, 20) },
  masihdisini: { Komponen: MasihDiSini, judulMulai: (a) => frameKata(a, 'masih', 1, 6), warnaJudul: C.ok, judulY: 690 },
  mirip: { Komponen: Mirip, judulMulai: (a) => frameKata(a, 'orang-orang', 1, 20), warnaJudul: C.algo },
  turnamen: { Komponen: Turnamen, judulMulai: () => 6 },
  ujian: { Komponen: Ujian, judulMulai: (a) => frameKata(a, 'berubah', 1, 110), warnaJudul: C.masak },
  kreator: { Komponen: Kreator, judulMulai: (a) => frameKata(a, 'bukan', 1, 30), warnaJudul: C.ok },
  penutup: { Komponen: Penutup, judulMulai: (a) => frameKata(a, 'sampai', 2, 120) },
};

const BungkusAdegan: React.FC<{ a: Adegan }> = ({ a }) => {
  const def = ADEGAN[a.id];
  if (!def) {
    throw new Error(`Adegan "${a.id}" belum punya komponen. Tambahkan di ADEGAN (src/FYPVideo.tsx).`);
  }
  const { Komponen } = def;
  return (
    <AbsoluteFill>
      <Komponen a={a} />
      <Headline
        teks={a.teks}
        mulai={def.judulMulai ? def.judulMulai(a) : 6}
        akhir={a.durationInFrames}
        warna={def.warnaJudul}
        y={def.judulY}
      />
      <Sumber teks={a.sumber} mulai={def.sumberMulai ? def.sumberMulai(a) : 10} />
      {a.audioSrc && (
        <Sequence from={a.leadIn} layout="none">
          <Html5Audio src={a.audioSrc} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

export const FYPVideo: React.FC<Props> = ({ adegan }) => {
  const f = useCurrentFrame();
  const awal = useMemo(() => {
    const arr: number[] = [];
    let t = 0;
    for (const a of adegan) {
      arr.push(t);
      t += a.durationInFrames;
    }
    return arr;
  }, [adegan]);
  const total = adegan.reduce((s, a) => s + a.durationInFrames, 0);
  const halaman = useMemo(() => susunSubtitle(adegan, awal), [adegan, awal]);

  const rentang = (id: string) => {
    const i = adegan.findIndex((a) => a.id === id);
    return i === -1 ? null : { s: awal[i], e: awal[i] + adegan[i].durationInFrames, a: adegan[i] };
  };

  // --- Timer global ---
  const hook = rentang('hook');
  const masih = rentang('masihdisini');
  const tutup = rentang('penutup');
  let tekan = 0;
  if (hook) tekan = Math.max(tekan, interpolate(f, [hook.e - 12, hook.e + 4], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  if (masih)
    tekan = Math.max(
      tekan,
      interpolate(f, [masih.s, masih.s + 8, masih.e - 8, masih.e], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    );
  if (tutup) {
    // besar di awal penutup, mengecil lagi saat judul "part 2" muncul
    const j = tutup.s + (ADEGAN.penutup.judulMulai?.(tutup.a) ?? 120);
    tekan = Math.max(
      tekan,
      interpolate(f, [tutup.s, tutup.s + 10, j - 8, j + 4], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    );
  }

  const henti = tutup ? tutup.s + frameKata(tutup.a, 'habis', 1, 30) + 6 : total;
  const putarBalik = total - 16;
  let nilai = Math.min(f, henti);
  if (f >= putarBalik) nilai = interpolate(f, [putarBalik, total - 2], [henti, 0], { extrapolateRight: 'clamp' });
  const berhenti = f >= henti && f < putarBalik;

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Latar />
      <Series>
        {adegan.map((a) => (
          <Series.Sequence key={a.id} durationInFrames={a.durationInFrames} name={a.id}>
            <BungkusAdegan a={a} />
          </Series.Sequence>
        ))}
      </Series>
      <Timer nilai={nilai} tekan={tekan} berhenti={berhenti} />
      <Subtitle halaman={halaman} />
      <Watermark handle={naskah.watermark} x={40} skala={0.85} />
    </AbsoluteFill>
  );
};
