# Seni Bina

Aplikasi web berbilang halaman (Vite, JavaScript ES modules tanpa rangka kerja) dengan pelayan Node.js (Express dan Socket.IO) yang **autoritatif**.

```
rabbaniyyah-mountain/
├── index.html · app.js · style.css   Laman utama
├── host.html  → src/pages/host.js    Guru: persediaan → lobi (kod + QR) → gunung langsung → keputusan
├── join.html  → src/pages/player.js  Pelajar: kod → nama → avatar → lobi → soalan → keputusan
├── solo.html  → src/pages/solo.js    Latihan solo (localStorage)
├── src/components/
│   ├── mountain.js        Peta gunung SVG: kedudukan melalui getPointAtLength, pengelompokan, kad nama
│   ├── question.js        Kad soalan (pilihan / susun ayat), pemasa, maklum balas
│   ├── avatar-picker.js   Pemilih avatar 4 langkah
│   └── results.js         Podium, anugerah, analitik, CSV
├── src/lib/               dom.js (utiliti), net.js (Socket.IO + permintaan berasaskan janji)
├── src/styles/game.css    Sistem reka bentuk permainan
├── shared/                Dikongsi pelayan dan klien
│   ├── game.js            Bank soalan, pemilihan seimbang, skor, altitud, analitik
│   └── avatar.js          Avatar SVG berlapis + pembersihan input
├── content/topics.json    Kandungan sebenar (dijana oleh scripts/import-content.py)
├── server.js              Sesi, peristiwa soket, QR, siaran
├── scripts/               dev.js, import-content.py, simulate.js (bot)
└── tests/                 Ujian unit + ujian penerimaan Live Mountain
```

## Aliran data

```
Pelajar ketik jawapan → answer {id, answer} → pelayan semak (satu jawapan setiap soalan)
→ kira skor, altitud, rentetan → siaran 'room' (digabung ≤10/saat) → host: avatar bergerak
```

- Klien **tidak pernah** menerima jawapan (`publicQuestion` membuang `answer`, `correctText`, `explanation`).
- Masa diukur oleh pelayan (`sentAt`). Jawapan melebihi had + 2 saat dikira salah.
- Jeda: jawapan ditolak dan pemasa bermula semula apabila disambung.

## Peristiwa soket

| Klien → Pelayan | Guna |
|---|---|
| `create {level, settings}` | Cipta sesi, pulangkan token host |
| `join {code, name, avatar}` | Sertai sesi |
| `resume {code, token}` | Sambung semula (host atau pemain) selepas muat semula / terputus |
| `control {action}` | `start`, `pause`, `resume`, `lock`, `unlock`, `remove`, `end` (host sahaja) |
| `answer {id, answer}` · `next` | Hantar jawapan · soalan seterusnya |

| Pelayan → Klien | Guna |
|---|---|
| `room` | Keadaan sesi penuh (pemain, kedudukan, status, keputusan) |
| `question` · `feedback` | Soalan semasa, atau maklum balas yang belum ditutup (dipulihkan selepas sambung semula) |
| `ended` · `removed` · `expired` | Tamat, dikeluarkan, tamat tempoh |

## Penyimpanan

Sesi disimpan dalam memori pelayan dan dibuang selepas 3 jam tanpa aktiviti. Token host dan pemain disimpan dalam `localStorage` untuk pemulihan. Jika pelayan dimulakan semula, sesi hilang. Untuk kekal lama, gantikan `rooms` (Map) dengan pangkalan data. Logik permainan dalam `shared/game.js` tidak perlu diubah.

## Had yang diketahui

- Level 7 dikunci kerana sumber hanya mempunyai 12 topik.
- Mod *guided* (guru mengawal setiap soalan), *mastery* dan *power-up* belum dilaksanakan. Mod sekarang: *Classic Climb* (ikut rentak pelajar) dan *Solo*.
- Jenis padanan, kategori, benar/salah dan gambar belum ada (lihat TOPICS_AUDIT.md).
