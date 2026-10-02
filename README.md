# Tayammum Tingkatan 2: permainan kelas

Bahan digital untuk pengajaran Tayammum (Pendidikan Islam KSSM Tingkatan 2, Standard Kandungan 4.10).

| Folder | Kandungan |
|---|---|
| `mountain/` | Pendakian Tayammum (enjin Mountain), tiga set soalan. Solo (statik) dan mod kelas langsung (pelayan Node, Socket.io) |
| `mario/` | Pengembaraan Tayammum, permainan platform Flutter (tiga level) |
| `bank/` | Bank soalan (JSON) yang menjadi sumber kedua-dua permainan |
| `docs/` | Dashboard (GitHub Pages) yang menghos Pendakian solo dan Pengembaraan, bersama kod QR |
| `render.yaml` | Blueprint Render untuk mod kelas langsung Mountain |

## Hos

- **GitHub Pages**: sumber `main`, folder `/docs`. Menghidangkan landing, Mountain solo dan Mario.
- **Render** (mod langsung): https://tayammum-mountain.onrender.com (halaman guru: `/host.html`), dibina daripada `mountain/` melalui `render.yaml`.

## Bina semula

- Mountain: `cd mountain && npm ci && python3 scripts/build-tayammum.py && npm test && npm run build`, kemudian salin `dist/` ke `docs/mountain/`.
- Mario: `cd mario && flutter pub get && flutter build web --release`, kemudian salin `build/web/` ke `docs/mario/` dan tukar `<base href>` kepada `./`.

Soalan bertanda [SAHKAN] dalam `bank/bank_tayammum.json` perlu disemak dengan buku teks.
