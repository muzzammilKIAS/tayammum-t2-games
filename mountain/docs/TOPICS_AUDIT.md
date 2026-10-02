# Audit Topik — Rabbaniyyah Mountain Challenge

**Sumber:** `GERAN RC/rabbaniyyah_app/lib/data/curriculum.dart` (aplikasi Flutter Rabbaniyyah, kelas `Dars111`–`Dars1112`).
Diimport oleh `scripts/import-content.py` ke `content/topics.json`. Tiada kandungan direka: semua soalan dibina daripada data dalam sumber.

## Dapatan utama

- Sumber mengandungi **12 topik** yang lengkap (`LessonRef 1–12`, semuanya `enabled: true`).
- **Topik 13 dan 14 tidak ditemui** dalam sumber. Oleh itu Level 7 (Final Summit) ditanda *belum tersedia* dan tidak boleh dipilih. Tiada topik direka untuk mengisinya.
- 3 item susun perkataan dalam sumber tidak sepadan dengan ayat jawapannya, jadi tidak digunakan (lihat bahagian akhir).

## Ringkasan kandungan setiap topik

| # | Tajuk | Kosa kata | Isi tempat kosong | Susun ayat | Soal jawab | Soalan dalam bank* |
|---|---|---|---|---|---|---|
| 1 | الإِيمَانُ بِاللهِ | 8 | 5 | 3 | 0 | 24 |
| 2 | الإِيمَانُ بِالْمَلَائِكَةِ وَالْكُتُبِ وَالرُّسُلِ | 9 | 4 | 3 | 5 | 30 |
| 3 | الإِيمَانُ بِالْيَوْمِ الآخِرِ وَالْقَضَاءِ وَالْقَدَرِ | 8 | 5 | 3 | 5 | 29 |
| 4 | الطَّهَارَةُ: الوُضُوءُ وَالغُسْلُ | 8 | 4 | 0 | 4 | 24 |
| 5 | الصَّلَاةُ المَفْرُوضَةُ: الأَوْقَاتُ، الأَرْكَانُ، وَالشُّرُوطُ | 8 | 4 | 1 | 5 | 26 |
| 6 | صِيَامُ رَمَضَانَ: الشُّرُوطُ، الأَرْكَانُ، وَالمُبْطِلَاتُ | 8 | 4 | 3 | 5 | 28 |
| 7 | صِفَاتُ الرَّسُولِ: الصِّدْقُ، الْأَمَانَةُ، التَّبْلِيغُ، الْفَطَانَةُ | 8 | 4 | 3 | 5 | 28 |
| 8 | الأَخْلَاقُ مَعَ اللهِ وَرَسُولِهِ | 8 | 4 | 2 | 5 | 27 |
| 9 | الأَخْلَاقُ فِي الأُسْرَةِ وَالمُجْتَمَعِ | 10 | 4 | 3 | 5 | 32 |
| 10 | مَوْلِدُ النَّبِيِّ وَحَيَاتُهُ الأُولَى | 10 | 4 | 3 | 5 | 32 |
| 11 | الْإِسْرَاءُ وَالْمِعْرَاجُ وَالْهِجْرَةُ | 9 | 4 | 3 | 5 | 30 |
| 12 | الصَّحَابَةُ الْمُخْتَارُونَ وَإِسْهَامَاتُهُمْ | 12 | 4 | 3 | 5 | 36 |

\* Setiap kosa kata menjana dua soalan: *Arab → Melayu* (kosa kata) dan *Melayu → Arab* (terjemahan). Semasa pemilihan, kedua-duanya dikira sebagai satu konsep supaya perkataan yang sama tidak muncul dua kali dalam satu sesi.

## Jenis soalan dan asal data

| Jenis | Medan sumber | Pengganggu (distractor) |
|---|---|---|
| Kosa kata (Arab → Melayu) | `vocab` | Maksud lain daripada topik yang sama |
| Terjemahan (Melayu → Arab) | `vocab` | Perkataan lain daripada topik yang sama |
| Lengkapkan ayat | `fillItems` + `fillBank` | Bank perkataan latihan asal |
| Soal jawab | `matchQuestions` + `matchAnswers` + `matchCorrectIndex` | Jawapan lain dalam aktiviti yang sama |
| Susun ayat | `wordOrder` | — (susunan token) |

Jenis *Padanan*, *Kategori*, *Benar/Salah* dan *Soalan gambar* belum dilaksanakan kerana sumber tidak menyediakan kunci jawapan yang boleh digunakan secara automatik tanpa tafsiran. Model data (`type`) sudah menyokong penambahannya kelak.

## Item sumber yang tidak digunakan

- **Topik 5**: token `الْقِبْلَةَ / اِسْتَقْبِلِ / وَ / قُمْ` ≠ jawapan `قُمْ وَاسْتَقْبِلِ الْقِبْلَةَ.`. Token tidak sepadan tepat dengan ayat jawapan; tidak digunakan.
- **Topik 5**: token `الْفَاتِحَةَ / اِقْرَأِ / ثُمَّ` ≠ jawapan `اِقْرَأِ الْفَاتِحَةَ ثُمَّ ارْكَعْ.`. Token tidak sepadan tepat dengan ayat jawapan; tidak digunakan.
- **Topik 8**: token `سُنَّتَهُ / أَتَّبِعُ / النَّبِيِّ` ≠ jawapan `أَتَّبِعُ سُنَّةَ النَّبِيِّ.`. Token tidak sepadan tepat dengan ayat jawapan; tidak digunakan.

Cadangan: semak item ini dalam manuskrip dan betulkan dalam `curriculum.dart`, kemudian jalankan `npm run import-content`.
