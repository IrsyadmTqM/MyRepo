import { getAudioDurationInSeconds } from '@remotion/media-utils';
import { getStaticFiles, staticFile } from 'remotion';
import naskah from './naskah.json';

export type Kata = { text: string; key: string; start: number; end: number }; // detik, relatif ke awal suara

export type Adegan = {
  id: string;
  vo: string;
  teks: string;
  sumber?: string;
  durationInFrames: number;
  /** frame (relatif adegan) saat suara mulai */
  leadIn: number;
  audioSrc: string | null;
  kata: Kata[];
};

export type Props = { adegan: Adegan[] };

export const FPS = naskah.fps;
const LEAD_IN = 0.2; // detik jeda sebelum suara mulai

export const normalisasi = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const pecahKata = (vo: string) => vo.split(/\s+/).filter(Boolean);

/** Perkiraan waktu tiap kata kalau belum ada file suara (dipakai untuk draf). */
const perkiraanKata = (vo: string, kataPerDetik: number): Kata[] => {
  const words = pecahKata(vo);
  const rata = 1 / kataPerDetik;
  const totalHuruf = words.reduce((a, w) => a + w.length, 0);
  const rataHuruf = totalHuruf / words.length;
  let t = 0;
  return words.map((w) => {
    const dur = rata * (0.55 + 0.45 * (w.length / rataHuruf));
    const k: Kata = { text: w, key: normalisasi(w), start: t, end: t + dur };
    t += dur;
    if (/[.!?…]$/.test(w)) t += 0.35;
    else if (/[,:;]$/.test(w)) t += 0.18;
    return k;
  });
};

type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

/** Ubah alignment per-huruf dari ElevenLabs (endpoint with-timestamps) jadi waktu per kata. */
const kataDariAlignment = (al: Alignment): Kata[] => {
  const hasil: Kata[] = [];
  let buf = '';
  let start = 0;
  let end = 0;
  const flush = () => {
    if (buf.trim()) hasil.push({ text: buf, key: normalisasi(buf), start, end });
    buf = '';
  };
  al.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      flush();
      return;
    }
    if (!buf) start = al.character_start_times_seconds[i];
    buf += ch;
    end = al.character_end_times_seconds[i];
  });
  flush();
  return hasil;
};

export const hitungAdegan = async (): Promise<Adegan[]> => {
  let files: string[] = [];
  try {
    files = getStaticFiles().map((f) => f.name);
  } catch {
    files = [];
  }
  const ada = (name: string) => files.includes(name);

  const out: Adegan[] = [];
  for (const a of naskah.adegan) {
    const mp3 = `vo/${a.id}.mp3`;
    const json = `vo/${a.id}.json`;
    let audioSrc: string | null = null;
    let durSuara: number | null = null;
    let kata: Kata[] | null = null;

    if (ada(mp3)) {
      audioSrc = staticFile(mp3);
      durSuara = await getAudioDurationInSeconds(audioSrc);
    }
    if (ada(json)) {
      const res = await fetch(staticFile(json));
      const data = await res.json();
      const al: Alignment | undefined = data.alignment ?? data.normalized_alignment ?? data;
      if (al && Array.isArray(al.characters)) kata = kataDariAlignment(al);
    }
    if (!kata) {
      kata = perkiraanKata(a.vo, naskah.kataPerDetik);
      if (durSuara) {
        // Ada suara tapi tidak ada alignment: regangkan perkiraan supaya pas dengan durasi asli.
        const akhir = kata[kata.length - 1].end;
        const f = (durSuara - 0.15) / akhir;
        kata = kata.map((k) => ({ ...k, start: k.start * f, end: k.end * f }));
      }
    }
    const panjangSuara = durSuara ?? kata[kata.length - 1].end;
    const totalDetik = Math.max(2, LEAD_IN + panjangSuara + naskah.jedaAkhirDetik);
    out.push({
      id: a.id,
      vo: a.vo,
      teks: a.teks,
      sumber: 'sumber' in a ? (a as { sumber?: string }).sumber : undefined,
      durationInFrames: Math.round(totalDetik * FPS),
      leadIn: Math.round(LEAD_IN * FPS),
      audioSrc,
      kata,
    });
  }
  return out;
};

/** Frame (relatif adegan) saat kata tertentu mulai diucapkan. `ke` = kemunculan ke-berapa (mulai 1). */
export const frameKata = (a: Adegan, kata: string, ke = 1, cadangan = 0): number => {
  const target = normalisasi(kata);
  let n = 0;
  for (const k of a.kata) {
    if (k.key === target || k.key.startsWith(target)) {
      n++;
      if (n === ke) return a.leadIn + Math.round(k.start * FPS);
    }
  }
  return cadangan;
};

/** Apakah narator sedang mengucapkan kata pada frame ini (untuk gerak mulut). */
export const sedangBicara = (a: Adegan, frame: number): boolean => {
  const t = (frame - a.leadIn) / FPS;
  return a.kata.some((k) => t >= k.start && t <= k.end + 0.02);
};
