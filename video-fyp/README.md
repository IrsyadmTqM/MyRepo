# Reels: "Kok FYP-mu bisa tahu kamu suka apa?"

Video animasi vertikal (1080×1920, 30 fps) tentang cara kerja algoritma rekomendasi TikTok & Instagram.
Naratornya **Si Algo**, maskot robot yang "mengukur" penonton sejak detik pertama.

Dibuat dengan [Remotion](https://www.remotion.dev/) (video dari kode React), jadi semuanya bisa diedit lewat Claude Code.

## Cara pakai

```bash
cd video-fyp
npm install
npm run studio        # preview & edit di browser (http://localhost:3000)
npm run render        # export ke out/fyp.mp4
npm run sampul        # export gambar sampul ke out/sampul.png
```

## Menambahkan suara ElevenLabs

Durasi tiap adegan, subtitle, dan gerak mulut Si Algo **otomatis menyesuaikan** dengan file suara.

**Cara A — otomatis lewat API (disarankan, subtitle paling pas):**

1. Buat file `video-fyp/.env` (sudah di-gitignore):
   ```
   ELEVENLABS_API_KEY=isi_api_key
   ELEVENLABS_VOICE_ID=isi_voice_id
   ```
2. Jalankan `npm run vo`, lalu `npm run render`.

Skrip ini menyimpan `public/vo/<id>.mp3` dan `public/vo/<id>.json` (timing per huruf untuk subtitle kata-per-kata).
Generate ulang satu adegan saja: `npm run vo -- hook`. Semua: `npm run vo -- --force`.

**Cara B — manual dari website ElevenLabs:**
Generate tiap kalimat adegan, download MP3-nya, lalu simpan dengan nama id adegan:
`public/vo/hook.mp3`, `public/vo/kenalan.mp3`, `public/vo/sinyal.mp3`, dst. (daftar id ada di `src/naskah.json`).
Tanpa file `.json`, timing subtitle diperkirakan dan diregangkan supaya pas dengan durasi suara.

## Struktur

| File | Isi |
|---|---|
| `src/naskah.json` | **Naskah**: teks narasi (`vo`), judul layar (`teks`), sumber, teks sampul |
| `src/scenes/*.tsx` | Animasi tiap adegan (Hook, Kenalan, Sinyal, Peta, MasihDiSini, Mirip, Turnamen, Ujian, Kreator, Penutup) |
| `src/components/Algo.tsx` | Karakter Si Algo (pose: `diam`, `lambai`, `stopwatch`, `catatan`) |
| `src/components/overlays.tsx` | Timer global, subtitle ala Reels, efek suara |
| `src/theme.ts` | Warna, font, area aman Reels |
| `scripts/generate-vo.mjs` | Generate suara ElevenLabs |
| `scripts/make-sfx.py` | Bikin ulang efek suara (`npm run sfx`) |

Animasi disinkronkan ke **kata** di narasi (`frameKata(a, 'kirim')`), jadi kalau kalimatnya diubah,
pastikan kata pemicunya masih ada — kalau tidak, dipakai frame cadangan.

## Contoh perintah ke Claude Code

- "Ganti warna Si Algo jadi oranye"
- "Di adegan sinyal, tambahkan ikon simpan (bookmark)"
- "Pendekkan narasi adegan turnamen jadi 2 kalimat"
- "Bikin episode baru: remote TV, pakai Si Algo dan gaya yang sama"

## Catatan

- Efek suara dibuat sendiri dengan kode (bebas hak cipta). Musik latar belum ada — tambahkan sendiri di `FYPVideo.tsx`.
- Logo/tampilan asli TikTok & Instagram sengaja tidak dipakai (HP & ikon generik).
- Lisensi Remotion: gratis untuk individu & tim kecil; cek https://www.remotion.dev/license untuk detailnya.
- Klaim di video: lama menonton sinyal kuat & follower bukan faktor langsung (TikTok Newsroom, 2020);
  lama nonton, like, dan kirim (sends) sinyal utama Reels (Adam Mosseri, Instagram, 2025).
