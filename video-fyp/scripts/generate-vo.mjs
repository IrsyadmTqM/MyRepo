// Generate suara narasi per adegan dengan ElevenLabs, plus timing per huruf
// (dipakai untuk subtitle kata-per-kata dan gerak mulut Si Algo).
//
// Pakai:
//   1. Buat file .env di folder video-fyp:
//        ELEVENLABS_API_KEY=xxxxxxxx
//        ELEVENLABS_VOICE_ID=xxxxxxxx
//        # opsional:
//        # ELEVENLABS_MODEL=eleven_multilingual_v2
//        # ELEVENLABS_LANGUAGE=id   (hanya untuk model turbo/flash v2.5)
//   2. npm run vo              -> generate adegan yang belum punya suara
//      npm run vo -- --force   -> generate ulang semua
//      npm run vo -- hook peta -> generate ulang adegan tertentu saja
//
// Hasil: public/vo/<id>.mp3 dan public/vo/<id>.json

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// baca .env sederhana
const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVENLABS_VOICE_ID;
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
const LANG = process.env.ELEVENLABS_LANGUAGE;

if (!KEY || !VOICE) {
  console.error('Isi ELEVENLABS_API_KEY dan ELEVENLABS_VOICE_ID di file .env dulu (lihat komentar di atas skrip ini).');
  process.exit(1);
}

const naskah = JSON.parse(fs.readFileSync(path.join(root, 'src/naskah.json'), 'utf8'));
const args = process.argv.slice(2);
const force = args.includes('--force');
const pilihan = args.filter((a) => !a.startsWith('--'));
const outDir = path.join(root, 'public/vo');
fs.mkdirSync(outDir, { recursive: true });

const adegan = naskah.adegan;
for (let i = 0; i < adegan.length; i++) {
  const a = adegan[i];
  const mp3 = path.join(outDir, `${a.id}.mp3`);
  const json = path.join(outDir, `${a.id}.json`);
  if (pilihan.length && !pilihan.includes(a.id)) continue;
  if (!pilihan.length && !force && fs.existsSync(mp3)) {
    console.log(`- ${a.id}: sudah ada, dilewati`);
    continue;
  }

  const body = {
    text: a.vo,
    model_id: MODEL,
    // teks sebelum/sesudah supaya intonasi antar-adegan nyambung
    previous_text: adegan[i - 1]?.vo,
    next_text: adegan[i + 1]?.vo,
    voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true },
  };
  if (LANG) body.language_code = LANG;

  process.stdout.write(`- ${a.id}: generate... `);
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    console.error(`gagal (${res.status}): ${await res.text()}`);
    process.exit(1);
  }
  const data = await res.json();
  fs.writeFileSync(mp3, Buffer.from(data.audio_base64, 'base64'));
  fs.writeFileSync(json, JSON.stringify({ alignment: data.alignment, normalized_alignment: data.normalized_alignment }, null, 1));
  console.log('ok');
}

console.log('\nSelesai. Jalankan "npm run studio" untuk preview atau "npm run render" untuk export MP4.');
