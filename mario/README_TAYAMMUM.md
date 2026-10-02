# Pengembaraan Tayammum (game platform gaya Mario)

Game solo untuk pelajar Tingkatan 2, Pendidikan Islam, DSKP KSSM SK 4.10 (Tayammum).
Dibina daripada modul Adventure/Flame aplikasi UMT3033. Mekanik dan seni kekal;
soalan pada pintu soalan diambil daripada `assets/data/bank_tayammum.json`
(salinan `../00_bank/bank_tayammum.json`, 38 soalan). Tiada Firebase, tiada pelayan.

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

## Diuji
- `flutter analyze`: bersih. `flutter test`: 17 lulus (bank 16/10/12 mengikut set, jawapan betul,
  penukaran arrange, simulasi platform 16 pintu hingga garisan penamat, widget pintu soalan lebar telefon).
- Chrome headless (Playwright): menu, peta level, platform dimuat, pintu soalan Tayammum,
  jawapan betul (+mata), jawapan salah (penalti +3 saat dan penjelasan), kemajuan Pintu 1/16 -> 3/16,
  Level 3 melalui `#/game/play?level=3`. Tangkapan skrin: `../_bukti/mario/`.

## Tidak diuji / diketahui
- Kawalan sentuh dan peranti sebenar (telefon) tidak diuji; hanya papan kekunci.
- Tamat penuh level di pelayar tidak dimainkan hingga akhir (disahkan melalui ujian simulasi sahaja).
- Skrin multiplayer (hos/sertai) masih ada dalam kod tetapi tidak dipaut dari menu; teksnya belum
  diterjemah. Tooltip butang kembali (AppBar) masih "Back" pada bacaan aksesibiliti.
- Bahagian kursus UMT (skrin, audio, JSON kursus, pelayan) dibuang daripada salinan ini sahaja.
