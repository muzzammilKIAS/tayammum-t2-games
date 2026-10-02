# Rabbaniyyah Mountain: Set Tayammum (HPGD3303)

Salinan game kelas "Rabbaniyyah Mountain" yang soalannya ditukar kepada **Tayammum** (Tingkatan 2, DSKP KSSM SK 4.10). Mekanik game tidak berubah. Sumber soalan tunggal: `../00_bank/bank_tayammum.json` (38 soalan). Projek asal tidak disentuh.

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

## Perubahan di luar `sets.json`
- `src/components/question.js`: soalan "susun" kini menggunakan arah kiri ke kanan (`dir="ltr"`) apabila token tiada huruf Arab. Sebelum ini token Melayu dipaparkan RTL sehingga susunan kelihatan terbalik. Token Arab kekal RTL.
- `src/styles/game.css`: satu baris gaya supaya token Melayu menggunakan fon UI.
- `tests/game.test.js`: ID set akhlak dikemas kini kepada ID set Tayammum.
- Tambahan: `scripts/build-tayammum.py`, `scripts/verify-tayammum.mjs`.

## Perkara perlu guru semak
Lima penjelasan dalam bank bertanda `[SAHKAN dengan buku teks]` (A10, A12, K03, K09, K11). Penanda ini **dibuang daripada paparan pelajar** tetapi kandungan fiqhnya tidak diubah. Sila sahkan dengan buku teks (had sapuan tangan hingga siku, bilangan tepukan, satu tayammum untuk satu solat fardu) sebelum digunakan.

## Apa yang diuji
- `npm test`: 13 ujian (logik set, skor, mod selamat, sesi langsung dengan 5 pemain palsu).
- `node scripts/verify-tayammum.mjs` (Playwright, Google Chrome): setiap set dimainkan hingga habis dengan jawapan betul dan salah berselang; teks soalan, penjelasan, arah token susun dan skrin keputusan disemak; `host.html` menyenaraikan tiga set dan Mod selamat boleh dihidupkan. Tangkapan skrin: `../_bukti/mountain/`.

## Apa yang tidak diuji
- Sesi langsung sebenar dengan telefon pelajar pada rangkaian bilik darjah (hanya pemain palsu dalam ujian).
- Jawapan bunyi/audio dan gambar (set Tayammum tidak mempunyai audio atau gambar; teks "audio, gambar & susun ayat" pada kad Set Guru ialah teks lama yang tidak diubah).
- Pelayar selain Chrome, dan paparan telefon.
- Ujian `tests/live.test.js` kadangkala gagal sekali dalam beberapa larian (perlumbaan masa dalam ujian; berlaku juga pada projek asal), dan lulus apabila dijalankan semula.
