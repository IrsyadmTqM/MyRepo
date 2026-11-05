import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

export const W = 1080;
export const H = 1920;

export const C = {
  bg: '#0B1022',
  bg2: '#121B3A',
  panel: '#18224A',
  panelLine: '#2A376B',
  text: '#F4F6FB',
  muted: '#8A94B8',
  algo: '#3EE6D0',
  kamu: '#FFD23F',
  danger: '#FF5A6E',
  ok: '#4ADE80',
  kucing: '#FF7EB6',
  masak: '#FF8A3D',
  bola: '#4ADE80',
  galau: '#8C9BFF',
  robot: '#3EE6D0',
};

export type Kategori = 'kucing' | 'masak' | 'bola' | 'galau' | 'robot';
export const KATEGORI: Kategori[] = ['kucing', 'masak', 'bola', 'galau', 'robot'];

export const FONT = '"Plus Jakarta Sans", sans-serif';

let loaded = false;
export const loadFonts = () => {
  if (loaded) return;
  loaded = true;
  for (const weight of ['500', '700', '800'] as const) {
    loadFont({
      family: 'Plus Jakarta Sans',
      url: staticFile(`fonts/plus-jakarta-sans-latin-${weight}-normal.woff2`),
      weight,
    });
  }
};

// Area aman Reels: hindari bagian atas (header), kanan bawah (tombol), bawah (caption).
export const SAFE = {
  timerY: 210,
  headlineY: 330,
  visualTop: 470,
  visualBottom: 1230,
  captionY: 1330,
  sumberY: 1282,
};
