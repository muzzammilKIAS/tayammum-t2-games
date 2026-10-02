# Pengembaraan Tayammum (game platform gaya Mario)

Game solo untuk pelajar Tingkatan 2, Pendidikan Islam, DSKP KSSM SK 4.10 (Tayammum).
Dibina daripada modul Adventure/Flame aplikasi UMT3033. Mekanik dan seni kekal;
soalan pada pintu soalan diambil daripada `assets/data/bank_tayammum.json`
(38 soalan). Tiada Firebase, tiada pelayan.

## Bina dan jalankan
```
export PATH=/Users/sufyanthawry/flutter/bin:$PATH
flutter pub get
flutter analyze && flutter test
flutter build web --release --base-href /tayammum_base/
sed -i '' 's|/tayammum_base/|./|g' build/web/index.html   # base href relatif
cd build/web && python3 -m http.server 3412                # buka http://localhost:3412/
```
`build/web` boleh dibuka dari folder statik atau GitHub Pages (base href `./`).
Kawalan: A/D atau anak panah untuk bergerak, Spasi untuk melompat; butang sentuh pada skrin.

## Pemetaan level ke kumpulan pelajar
| Level | Nama | Set bank | Pintu | Kumpulan |
|---|---|---|---|---|
| 1 | Asas Tayammum | asas | 16 | Kesan tahap, semua pelajar |
| 2 | Tebus Langkah Tayammum | tebus | 10 | Pemulihan |
| 3 | Klinik Hukum Tayammum | klinik | 12 | Pengayaan KBAT |

Semua level terbuka; guru menentukan kumpulan mana bermula di level mana.
Pilihan jawapan disusun semula secara tetap (berdasarkan id soalan) kerana dalam
bank jawapan betul sentiasa indeks 0. Soalan `arrange` (A12, T09) ditukar kepada
pilihan ganda "Pilih susunan langkah yang betul" dengan susunan betul dan tiga
susunan salah daripada langkah yang sama (tiada kandungan hukum baharu).
Teg `[SAHKAN ...]` pada penjelasan disembunyikan daripada pelajar di dalam game
(masih ada dalam JSON); semak item itu dengan buku teks sebelum digunakan.
Label SK pada pintu ialah `SK 4.10.n` (n daripada nombor sk bank).

## Pembersihan sisa game/kursus asal
- Skrin dan perkhidmatan multiplayer (hos/sertai bilik, papan perlumbaan, perkhidmatan bilik) dibuang
  sepenuhnya daripada `lib/` dan laluan `/game/host|join|lobby`; tiada teks Inggeris boleh dicapai.
- Tooltip butang kembali kini "Kembali" (bar tajuk tersuai, bukan "Back"); tag "LEVEL" menjadi "TAHAP";
  tajuk CSV eksport dalam Bahasa Melayu; kunci simpanan `tayammum_t2_v1`; tajuk app iOS dan warna tema manifest dibetulkan.
- Telefon (390x844): tajuk "Pengembaraan Tayammum" tidak lagi terpotong di tengah perkataan; petunjuk papan kekunci
  "A / D - SPAS" disembunyikan pada skrin sempit; tajuk "Pengembaraan dijeda" muat lebar telefon.
- Isi soalan, jawapan dan hukum (`assets/data/bank_tayammum.json`) tidak diubah.

## Diuji
- `flutter analyze`: bersih. `flutter test`: 10 lulus (bank 16/10/12 mengikut set, jawapan betul,
  penukaran arrange, simulasi platform 16 pintu hingga garisan penamat, pintu soalan dan skrin keputusan pada lebar telefon).
- Chrome sistem (Playwright), telefon 390x844 dengan sentuhan (hasTouch, CDP touch): menu, pilih perantau, peta tahap,
  Tahap 1/2/3 dimulakan melalui butang menu (bukan URL), butang Kanan/Lompat pada skrin menggerakkan pemain hingga
  Pintu 1 (Tahap 1), pintu soalan Tahap 2 dan 3 dipaparkan; jawapan betul pada Tahap 1 (+mata, Pintu 0/16 -> 1/16);
  jeda/sambung. Desktop 1280x800: menu, peta, game. Pemeriksaan teks melalui pokok semantik: tiada teks Inggeris/Arab.
- Bukti: `../_bukti_pembersihan/mario/` (tidak dipush).

## Tidak diuji / diketahui
- Peranti telefon sebenar (hanya emulasi sentuhan Chrome); jawapan salah pada telefon dan tamat penuh level dalam pelayar
  tidak dimainkan hingga akhir (disahkan melalui ujian simulasi sahaja).
- Nama pakej Dart masih `umt3033_app` (dalaman, tidak kelihatan kepada pengguna).
- Seni latar (kubah/masjid) ialah ilustrasi umum; tiada papan tanda bertulis dalam enjin.
