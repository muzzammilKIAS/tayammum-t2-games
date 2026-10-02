# Pengembaraan Tayammum (game platform gaya Mario)

Game solo dan mod kelas langsung untuk pelajar Tingkatan 2, Pendidikan Islam, DSKP KSSM SK 4.10 (Tayammum).
Dibina daripada modul Adventure/Flame aplikasi UMT3033. Mekanik dan seni kekal;
soalan pada pintu soalan diambil daripada `assets/data/bank_tayammum.json`
(38 soalan). Solo tidak memerlukan pelayan; mod kelas langsung memerlukan pelayan WebSocket (`server/`).

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

## Mod kelas langsung (guru memaparkan perlumbaan di projektor)
Menu utama ada tiga laluan: **Main sendiri**, **Mod kelas (guru)** (`#/game/host`) dan **Sertai dengan kod**
(`#/game/join`). Guru memilih tahap (Asas / Tebus / Klinik), memaparkan kod bilik dan QR; pelajar menyertai
dengan telefon, guru menekan **Mulakan perlumbaan**, papan perlumbaan dikemas kini setiap kali pelajar menjawab.
Keputusan akhir ada analisis mengikut Standard Pembelajaran (SK 4.10.n, paling lemah dahulu) dan eksport CSV.

- Pelayan: `server/` (Dart, WebSocket `/ws`, `/healthz`). Bilik dalam memori sahaja; tiada pangkalan data.
  Peraturan bilik dikongsi dengan klien melalui `packages/game_shared/`.
- Jalankan pelayan setempat: `cd server && dart pub get && PORT=8080 dart run bin/main.dart`, kemudian bina web dengan
  `flutter build web --release --base-href /tayammum_base/ --dart-define=GAME_SERVER_WS_URL=ws://localhost:8080/ws`.
- Render (Blueprint): `render.yaml` di akar repo mempunyai servis kedua **`tayammum-mario-server`** (Docker,
  `mario/server/Dockerfile`, konteks `mario/`, pelan free, Singapore, `PORT=8080`, semakan `/healthz`).
  Di Render: New > Blueprint > pilih repo ini > Apply. Alamat lalai yang dijangka ialah
  `wss://tayammum-mario-server.onrender.com/ws` (sudah tertanam sebagai nilai lalai dalam klien).
- Menimpa URL pelayan tanpa membina semula (jika nama servis berubah): buka halaman dengan
  `.../mario/#/game/host?server=wss://NAMA-BAHARU.onrender.com/ws` (atau `?server=...` sebelum `#`). Nilai disimpan
  dalam localStorage pelayar itu dan pautan/QR sertai membawa nilai yang sama ke telefon pelajar. `server=local`
  memaksa pratonton tempatan (pelayar yang sama sahaja). Butang "Guna pelayan lalai" memadam penimpaan.
  Keutamaan: parameter URL > localStorage > `--dart-define GAME_SERVER_WS_URL` > nilai lalai terbina dalam.
- Nota pelan free: servis tidur selepas kira-kira 15 minit tidak aktif; sambungan pertama selepas itu boleh
  mengambil masa sehingga seminit. Buka halaman guru 2-3 minit sebelum kelas/rakaman supaya pelayan sudah bangun.
  Memulakan semula/penggunaan semula pelayan memadam semua bilik aktif.
- Pelajar yang menyegarkan halaman, atau guru yang menyegarkan halaman, kembali ke bilik yang sama (identiti
  dalam sessionStorage). Sambungan WebSocket yang terputus disambung semula secara automatik.

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
- Mod host langsung dipulihkan (lihat bahagian Mod kelas) dan diterjemah sepenuhnya ke Bahasa Melayu.
- Tooltip butang kembali kini "Kembali" (bar tajuk tersuai, bukan "Back"); tag "LEVEL" menjadi "TAHAP";
  tajuk CSV eksport dalam Bahasa Melayu; kunci simpanan `tayammum_t2_v1`; tajuk app iOS dan warna tema manifest dibetulkan.
- Telefon (390x844): tajuk "Pengembaraan Tayammum" tidak lagi terpotong di tengah perkataan; petunjuk papan kekunci
  "A / D - SPAS" disembunyikan pada skrin sempit; tajuk "Pengembaraan dijeda" muat lebar telefon.
- Isi soalan, jawapan dan hukum (`assets/data/bank_tayammum.json`) tidak diubah.

## Diuji (game solo, sebelum mod kelas dipulihkan)
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

## Diuji (mod kelas langsung)
- `flutter analyze` bersih; `flutter test` 19 lulus (termasuk adapter bilik 2/10/50 pelajar, URL pelayan, pautan sertai,
  papan perlumbaan 20/50 pelajar pada 1280x720).
- Playwright + Chrome sistem, pelayan Dart setempat (port 3416) dan web dihidang di 3417: guru cipta bilik, dua pelajar
  (390x844) sertai dengan kod, mula, kiraan detik, jawab pintu (betul dan salah), papan guru dikemas kini, muat semula
  halaman guru dan telefon (kembali ke bilik), tamat, keputusan + analisis SK + CSV, tahap seterusnya; penimpaan
  `?server=` (hash), `server=local`, ralat pelayan salah, sambung semula selepas pelayan dimulakan semula.
  Dilakukan pada build debug-define dan pada build akhir produksi (dengan penimpaan `?server=` ke pelayan setempat).
  Pelayan menerima Origin `https://muzzammilkias.github.io` (101 Switching Protocols) dan `/healthz` memberi `ok`.
- Bukti: `../_bukti_pembersihan/mario_host/` (tidak dipush).
- Tidak diuji: Docker (tidak dipasang pada mesin ini; Dockerfile disalin daripada versi asal dan diubah laluan sahaja),
  Render sebenar (belum dideploy), peranti telefon sebenar, kelas penuh 50 pelajar secara langsung, perlumbaan hingga
  semua pelajar menamatkan 16 pintu dalam pelayar.
