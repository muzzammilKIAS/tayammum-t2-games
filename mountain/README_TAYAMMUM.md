# Pendakian Tayammum (Tingkatan 2)

Game pendakian gunung berasaskan **Tayammum** (Tingkatan 2, DSKP KSSM SK 4.10). Mekanik game (gunung, avatar, sesi langsung, mod selamat, analitik, CSV) dikekalkan. Jenama, UI dan kandungan kini sepenuhnya Tayammum dalam Bahasa Melayu; tiada lagi mod 7 level / 12 topik kosa kata Arab. Sumber soalan tunggal: `../00_bank/bank_tayammum.json` (38 soalan). Projek asal tidak disentuh.

## Jana semula soalan
`python3 scripts/build-tayammum.py` menulis `content/sets.json` (tiga set sahaja; set akhlak lama dibuang).

## Mod kelas (langsung)
1. `PORT=3411 npm start` (membina kemudian menjalankan pelayan; pilih port lain jika 3411 digunakan).
2. Guru buka `http://localhost:3411/host.html` pada projektor, pilih satu set dalam **Set Guru**, hidupkan **Mod selamat** jika perlu (tiada bonus kelajuan, nama dan kedudukan disembunyikan), kemudian cipta sesi.
3. Pelajar buka alamat rangkaian kelas yang dicetak oleh pelayan (contoh `http://192.168.x.x:3411/join.html`) atau imbas kod QR, kemudian masukkan **kod sesi 6 digit** dan nama.

## Pautan solo setempat (pelayan sedang berjalan)
- Asas: `http://localhost:3411/solo.html?set=tayammum-asas`
- Tebus: `http://localhost:3411/solo.html?set=tayammum-tebus`
- Klinik: `http://localhost:3411/solo.html?set=tayammum-klinik`

## Pemetaan set kepada kumpulan pelajar
| Set (id) | Soalan | Kumpulan | Tujuan |
|---|---|---|---|
| Tayammum: Asas (`tayammum-asas`) | 16 | Semua pelajar | Mengesan tahap penguasaan |
| Pusingan Tebus (`tayammum-tebus`) | 10 | Pelajar yang belum menguasai | Pemulihan, soalan langkah demi langkah |
| Klinik Fiqah (`tayammum-klinik`) | 12 | Pelajar yang telah menguasai | Pengayaan KBAT, situasi dan penilaian |

## Pembersihan sisa game Arab (Okt 2026)
- Dibuang daripada UI dan kod: jenama "Rabbaniyyah Mountain Challenge" dan teks Arab (tajuk, label topik, ucapan, petikan), mod level/topik (host, solo, laman utama, `shared/game.js`, `server.js`), jenis soalan kosa kata/terjemahan/isi tempat kosong, audio, fon Amiri, pembantu RTL, kunci simpanan `rmc-*` (kini `tm-*`).
- Hanya tiga Set Guru tersedia (`tayammum-asas`, `tayammum-tebus`, `tayammum-klinik`). Medan `topics`/`topicTitle` dalam `content/sets.json` ditukar daripada tulisan Arab kepada "Tayammum" (isi soalan dan hukum tidak diubah).
- Jenama BM baharu: "Pendakian Tayammum"; istilah "Base Camp/Checkpoint" menjadi "Kem Pangkal/Persinggahan".
- `vite.config.js`: `publicDir: false` supaya media lama (`public/media/akhlak`) tidak masuk ke `dist/`.
- Fail lama tidak dirujuk lagi dan boleh dipadam secara manual: `content/topics.json`, `content/import-issues.json`, `public/media/`, `docs/` (LEVEL_MAPPING, TOPICS_AUDIT, ARCHITECTURE), `scripts/build-audio.py`, `scripts/build-sets.py`, `scripts/import-content.py`.
- Ujian dikemas kini (`tests/game.test.js`, `tests/live.test.js`: set Tayammum, tiada Arab dalam `sets.json`; ujian langsung kini menunggu soalan bukan-null sebelum menyemak, jadi tidak lagi gagal berselang).
- `scripts/audit-pembersihan.mjs`: audit Playwright (index, solo tiga set, host, pelajar, projektor, keputusan) yang menandakan sebarang teks Arab/Inggeris/Rabbaniyyah. Guna `BASE=http://localhost:PORT node scripts/audit-pembersihan.mjs`.

## Perkara perlu guru semak
Lima penjelasan dalam bank bertanda `[SAHKAN dengan buku teks]` (A10, A12, K03, K09, K11). Penanda ini **dibuang daripada paparan pelajar** tetapi kandungan fiqhnya tidak diubah. Sila sahkan dengan buku teks (had sapuan tangan hingga siku, bilangan tepukan, satu tayammum untuk satu solat fardu) sebelum digunakan.

## Apa yang diuji
- `npm test`: 12 ujian lulus (diulang 6 kali tanpa kegagalan).
- Audit Playwright (Google Chrome): ketiga-tiga set solo hingga skrin keputusan; host cipta sesi, pelajar (telefon 390px) sertai, jawab semua soalan, paparan gunung/pisah/kedudukan/projektor, keputusan dan butang CSV; tiada teks Arab, Rabbaniyyah atau Inggeris dikesan. `node scripts/verify-tayammum.mjs` juga lulus. Tangkapan skrin: `../_bukti_pembersihan/mountain/`.
- `dist/` dan `../docs/mountain/` bebas daripada aksara Arab dan perkataan Rabbaniyyah/vocab; `docs/mountain/solo.html?set=...` berfungsi (diuji melalui pelayan statik, laluan relatif).

## Apa yang tidak diuji
- Sesi langsung sebenar dengan telefon pelajar pada rangkaian bilik darjah, dan hos Render sebenar selepas push.
- Pelayar selain Chrome.
