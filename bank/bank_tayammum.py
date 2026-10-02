"""Bank soalan Tayammum (Tingkatan 2, DSKP KSSM SK 4.10). Sumber tunggal untuk game Mountain, game Mario, slaid dan Google Form.
Hukum mengikut mazhab Syafie aras buku teks. Semua item bertanda SAHKAN perlu disemak dengan buku teks Tingkatan 2 oleh pengguna.
Jalankan: python3 bank_tayammum.py  -> bank_tayammum.json
"""
import json
from pathlib import Path

def mcq(i, st, q, opts, ans, exp, sk, *, kbat=False):
    return {"id": i, "set": st, "type": "mcq", "q": q, "options": opts, "answer": ans, "explanation": exp, "sk": sk, "kbat": kbat}

def arrange(i, st, q, seq, exp, sk):
    return {"id": i, "set": st, "type": "arrange", "q": q, "sequence": seq, "explanation": exp, "sk": sk, "kbat": False}

BANK = [
 # ---- ASAS (pusingan 1: semua pelajar / kesan tahap) ----
 mcq("A01", "asas", "Apakah yang dimaksudkan dengan tayammum?",
     ["Menyapu debu tanah yang suci ke muka dan kedua-dua tangan dengan cara tertentu serta niat, sebagai ganti wuduk atau mandi wajib",
      "Membasuh semua anggota wuduk dengan air yang sedikit", "Menyapu kepala dan kaki dengan air", "Mandi dengan air yang suci lagi menyucikan"], 0,
     "Tayammum ialah menyapu debu tanah yang suci ke muka dan kedua-dua tangan dengan cara tertentu serta niat, bagi menggantikan wuduk atau mandi wajib.", "4.10.1"),
 mcq("A02", "asas", "Dalil al-Quran tentang tayammum terdapat dalam surah …",
     ["Surah al-Ma'idah, ayat 6", "Surah al-Fatihah, ayat 1", "Surah al-Ikhlas, ayat 1", "Surah al-Kauthar, ayat 1"], 0,
     "Surah al-Ma'idah ayat 6 menyebut tayammum apabila tiada air untuk berwuduk atau mandi.", "4.10.1"),
 mcq("A03", "asas", "Antara sebab tayammum diharuskan ialah …",
     ["Air tiada selepas puas dicari", "Tidak sempat berwuduk kerana asyik bermain", "Air di rumah terlalu banyak", "Tidak suka menggunakan air"], 0,
     "Tayammum hanya diharuskan apabila ada sebab sebenar, antaranya tiada air atau tidak cukup, air terlalu jauh, sakit yang tidak boleh terkena air, dan cuaca sejuk yang memudaratkan.", "4.10.2"),
 mcq("A04", "asas", "Zaid demam teruk dan doktor melarangnya terkena air. Apakah hukum Zaid bertayammum?",
     ["Diharuskan kerana sakit yang tidak boleh menggunakan air", "Tidak boleh, dia mesti berwuduk juga", "Wajib meninggalkan solat", "Hanya boleh jika ibunya membenarkan"], 0,
     "Sakit yang tidak membolehkan seseorang menggunakan air ialah salah satu sebab tayammum diharuskan.", "4.10.2"),
 mcq("A05", "asas", "Bahan yang sah digunakan untuk bertayammum ialah …",
     ["Debu tanah yang suci dan tidak bercampur", "Tepung gandum", "Kapur tulis", "Gula halus"], 0,
     "Debu mestilah daripada tanah yang suci dan tidak bercampur dengan bahan lain seperti tepung atau kapur.", "4.10.3"),
 mcq("A06", "asas", "Tayammum hanya boleh dilakukan selepas …",
     ["Masuk waktu solat dan telah mencari air", "Sebelum masuk waktu solat", "Selesai solat", "Bila-bila masa tanpa mengira waktu"], 0,
     "Antara syarat tayammum ialah telah masuk waktu solat dan air telah dicari selepas masuk waktu.", "4.10.3"),
 mcq("A07", "asas", "Najis yang ada pada badan perlu …",
     ["Dihilangkan dahulu sebelum bertayammum", "Dibiarkan sahaja", "Disapu dengan debu bersama muka", "Dihilangkan selepas solat"], 0,
     "Menghilangkan najis terlebih dahulu ialah salah satu syarat tayammum.", "4.10.3"),
 mcq("A08", "asas", "Niat tayammum dilakukan …",
     ["Dalam hati", "Dengan kuat sahaja tanpa hati", "Selepas menyapu tangan", "Tidak diperlukan"], 0,
     "Niat ialah rukun dan tempatnya di dalam hati. Melafazkannya hanyalah sunat membantu hati.", "4.10.4"),
 mcq("A09", "asas", "Anggota yang disapu dengan debu semasa bertayammum ialah …",
     ["Muka dan kedua-dua tangan", "Kepala dan kedua-dua kaki", "Muka, tangan, kepala dan kaki", "Tapak tangan sahaja"], 0,
     "Tayammum hanya menyapu muka dan kedua-dua tangan, tidak seperti wuduk.", "4.10.4"),
 mcq("A10", "asas", "Sapuan debu pada kedua-dua tangan hendaklah sampai …",
     ["Siku", "Pergelangan tangan", "Bahu", "Hujung jari sahaja"], 0,
     "Mengikut mazhab Syafie, tangan disapu sehingga siku. [SAHKAN dengan buku teks]", "4.10.4"),
 mcq("A11", "asas", "Anggota yang disapu dahulu ialah …",
     ["Muka, kemudian tangan", "Tangan, kemudian muka", "Kepala, kemudian kaki", "Mana-mana dahulu"], 0,
     "Tertib: muka disapu dahulu, kemudian kedua-dua tangan.", "4.10.4"),
 arrange("A12", "asas", "Susun langkah bertayammum dengan betul",
     ["Berniat dalam hati", "Menepuk tapak tangan pada debu", "Menyapu muka", "Menepuk tapak tangan pada debu semula", "Menyapu tangan hingga siku"],
     "Urutan: niat, tepuk debu, sapu muka, tepuk debu semula, sapu tangan hingga siku. [SAHKAN status tepukan kali kedua dengan buku teks]", "4.10.8"),
 mcq("A13", "asas", "Antara perkara yang membatalkan tayammum ialah …",
     ["Ada air sebelum solat dimulakan", "Membaca al-Quran", "Berzikir selepas solat", "Berjalan ke masjid"], 0,
     "Tayammum batal jika ada air sebelum solat dimulakan, jika boleh menggunakan air semula, dan dengan perkara yang membatalkan wuduk.", "4.10.6"),
 mcq("A14", "asas", "Tayammum juga batal dengan perkara yang membatalkan wuduk, contohnya …",
     ["Keluar angin dari dubur", "Menyapu muka", "Membaca doa", "Duduk di atas lantai"], 0,
     "Perkara yang membatalkan wuduk turut membatalkan tayammum.", "4.10.6"),
 mcq("A15", "asas", "Hikmah tayammum disyariatkan ialah …",
     ["Memudahkan hamba menunaikan solat apabila sukar menggunakan air", "Supaya manusia tidak perlu mandi lagi", "Supaya solat boleh ditinggalkan", "Supaya air dijimatkan sahaja"], 0,
     "Tayammum ialah rukhsah (keringanan) daripada Allah supaya solat tetap dapat ditunaikan dalam semua keadaan.", "4.10.7"),
 mcq("A16", "asas", "Tayammum menggantikan …",
     ["Wuduk dan mandi wajib", "Solat fardu", "Puasa", "Zakat"], 0,
     "Tayammum menggantikan wuduk atau mandi wajib apabila ada keuzuran yang dibenarkan.", "4.10.1"),

 # ---- TEBUS (pemulihan: lebih mudah, satu langkah demi satu langkah) ----
 mcq("T01", "tebus", "Langkah PERTAMA bertayammum ialah …",
     ["Berniat dalam hati", "Menyapu tangan", "Menyapu muka", "Menepuk kaki"], 0, "Bermula dengan niat dalam hati.", "4.10.8"),
 mcq("T02", "tebus", "Selepas berniat, kita …",
     ["Menepuk tapak tangan pada debu yang suci", "Terus menyapu tangan", "Terus bersolat", "Membasuh muka dengan air"], 0, "Tapak tangan ditepuk pada debu tanah yang suci.", "4.10.8"),
 mcq("T03", "tebus", "Selepas menepuk debu, anggota yang disapu dahulu ialah …",
     ["Muka", "Tangan", "Kaki", "Kepala"], 0, "Muka disapu dahulu.", "4.10.8"),
 mcq("T04", "tebus", "Tangan disapu sehingga …",
     ["Siku", "Bahu", "Jari", "Lutut"], 0, "Kedua-dua tangan disapu hingga ke siku.", "4.10.8"),
 mcq("T05", "tebus", "Apakah anggota yang disapu semasa tayammum?",
     ["Muka dan tangan", "Kepala dan kaki", "Telinga dan leher", "Perut dan dada"], 0, "Hanya muka dan kedua-dua tangan.", "4.10.4"),
 mcq("T06", "tebus", "Contoh debu yang BOLEH digunakan ialah …",
     ["Debu tanah yang bersih", "Tepung roti", "Kapur", "Gula"], 0, "Gunakan debu tanah yang suci dan tidak bercampur.", "4.10.3"),
 mcq("T07", "tebus", "Situasi manakah tayammum DIHARUSKAN?",
     ["Tiada air selepas puas dicari", "Air ada tetapi malas berwuduk", "Air ada banyak di paip", "Masih awal sebelum waktu solat"], 0, "Tayammum diharuskan apabila ada sebab sebenar seperti tiada air.", "4.10.2"),
 mcq("T08", "tebus", "Jika ada air sebelum kita mula solat, tayammum …",
     ["Batal", "Masih sah", "Tidak berubah", "Menjadi wajib sunat"], 0, "Ada air sebelum solat dimulakan membatalkan tayammum.", "4.10.6"),
 arrange("T09", "tebus", "Susun tiga langkah mudah bertayammum",
     ["Berniat", "Sapu muka", "Sapu tangan"], "Niat, sapu muka, kemudian sapu tangan.", "4.10.8"),
 mcq("T10", "tebus", "Padankan: tayammum ialah ganti kepada …",
     ["Wuduk dan mandi wajib", "Solat", "Puasa", "Sedekah"], 0, "Tayammum menggantikan wuduk dan mandi wajib.", "4.10.1"),

 # ---- KLINIK (pengayaan: kes, menganalisis dan menilai) ----
 mcq("K01", "klinik", "Ali bertayammum kerana tiada air. Sebelum sempat bersolat, dia ternampak sebuah perigi yang airnya boleh digunakan. Apakah keputusannya?",
     ["Tayammumnya batal; dia perlu berwuduk dengan air itu", "Tayammumnya masih sah kerana sudah bermula", "Dia boleh memilih sama ada mahu berwuduk atau tidak", "Solatnya gugur"], 0,
     "Ada air sebelum solat dimulakan membatalkan tayammum, maka dia perlu menggunakan air itu.", "4.10.6", kbat=True),
 mcq("K02", "klinik", "Farid menepuk debu, menyapu muka dan tangannya mengikut urutan, tetapi terlupa berniat. Apakah keputusannya?",
     ["Tidak sah kerana niat ialah rukun", "Sah kerana urutannya betul", "Sah jika dia berniat selepas solat", "Sah kerana anggota sudah disapu"], 0,
     "Niat ialah rukun. Tanpa niat tayammum tidak sah walaupun gerakannya betul.", "4.10.4", kbat=True),
 mcq("K03", "klinik", "Siti bertayammum untuk solat Asar. Selepas itu dia mahu menunaikan solat Maghrib dengan tayammum yang sama. Apakah keputusannya?",
     ["Tidak boleh; satu tayammum untuk satu solat fardu", "Boleh kerana tayammumnya belum batal", "Boleh jika dia berniat semula dalam hati sahaja", "Boleh hanya untuk solat yang tiga rakaat"], 0,
     "Mengikut mazhab Syafie, satu tayammum untuk satu solat fardu (dan solat sunat yang dikehendaki). [SAHKAN dengan buku teks]", "4.10.6", kbat=True),
 mcq("K04", "klinik", "Dalam perkhemahan, air yang tinggal hanya cukup untuk diminum sepanjang hari. Waktu Zohor sudah masuk. Apa yang patut dilakukan?",
     ["Bertayammum kerana air tidak cukup untuk keperluan lain", "Berwuduk dengan air minuman itu", "Meninggalkan solat sehingga ada air", "Menangguhkan solat hingga malam"], 0,
     "Air yang tidak cukup kerana diperlukan untuk minum ialah sebab diharuskan tayammum. Solat tidak boleh ditinggalkan.", "4.10.2", kbat=True),
 mcq("K05", "klinik", "Hafiz tiada tanah, lalu dia bertayammum menggunakan tepung gandum. Apakah keputusannya?",
     ["Tidak sah kerana debu mesti daripada tanah yang suci dan tidak bercampur", "Sah kerana tepung ialah debu", "Sah jika tepungnya halus", "Sah jika dia berniat dengan ikhlas"], 0,
     "Debu yang sah ialah debu tanah yang suci dan tidak bercampur dengan bahan seperti tepung.", "4.10.3", kbat=True),
 mcq("K06", "klinik", "Nurul bertayammum pada pukul 12.00 tengah hari, sedangkan waktu Zohor masuk pada pukul 1.15 petang. Apakah keputusannya?",
     ["Tidak sah kerana tayammum belum masuk waktu", "Sah kerana dia sudah bersedia", "Sah jika dia solat Zohor awal", "Sah kerana ada air yang jauh"], 0,
     "Masuk waktu solat ialah syarat tayammum.", "4.10.3", kbat=True),
 mcq("K07", "klinik", "Aman sudah bertayammum, kemudian keluar angin sebelum solat. Apakah keputusannya?",
     ["Tayammumnya batal; dia mesti berwuduk atau bertayammum semula mengikut keadaan", "Tayammumnya masih sah", "Dia hanya perlu berniat semula", "Dia terus boleh solat"], 0,
     "Perkara yang membatalkan wuduk turut membatalkan tayammum.", "4.10.6", kbat=True),
 mcq("K08", "klinik", "Zainal bertayammum kerana demam dan doktor melarang air. Seminggu kemudian dia sembuh dan boleh menggunakan air. Apakah yang berlaku kepada keharusan tayammumnya?",
     ["Tidak lagi diharuskan; dia mesti berwuduk kerana boleh menggunakan air", "Masih diharuskan selama-lamanya", "Diharuskan jika dia malas berwuduk", "Dia boleh memilih"], 0,
     "Boleh menggunakan air semula membatalkan tayammum dan menghilangkan keharusannya.", "4.10.6", kbat=True),
 mcq("K09", "klinik", "Aisyah menyapu muka dan kedua-dua tangannya hanya sampai pergelangan tangan. Apakah penilaian terbaik?",
     ["Tidak sempurna kerana tangan mesti disapu hingga siku", "Sempurna kerana tangan sudah disapu", "Sempurna kerana muka sudah disapu", "Sempurna jika debunya banyak"], 0,
     "Had sapuan tangan ialah hingga siku. [SAHKAN dengan buku teks]", "4.10.4", kbat=True),
 mcq("K10", "klinik", "Pasangan A berkata: \"Tayammum lebih mudah, jadi boleh dipilih walaupun air ada.\" Penilaian yang paling tepat ialah …",
     ["Salah kerana tayammum keringanan yang hanya diharuskan apabila ada sebab sebenar", "Betul kerana agama itu mudah", "Betul kerana debu lebih bersih daripada air", "Betul jika solat hampir tamat"], 0,
     "Rukhsah hanya dipakai apabila ada sebab yang dibenarkan, bukan atas pilihan atau kemalasan.", "4.10.7", kbat=True),
 mcq("K11", "klinik", "Selepas solat Zohor dengan tayammum, Imran mahu solat sunat rawatib dengan tayammum yang sama dan tayammumnya belum batal. Apakah penilaian yang tepat?",
     ["Boleh kerana solat sunat boleh dilakukan dengan tayammum solat fardu", "Tidak boleh kerana tayammum hanya untuk satu solat sahaja", "Boleh hanya selepas Isyak", "Tidak boleh kerana mesti diulang"], 0,
     "Mengikut mazhab Syafie, satu tayammum untuk satu solat fardu dan solat sunat yang dikehendaki. [SAHKAN dengan buku teks]", "4.10.6", kbat=True),
 mcq("K12", "klinik", "Mengapakah kita perlu mencari air dahulu selepas masuk waktu sebelum bertayammum?",
     ["Kerana tayammum hanya keringanan apabila air benar-benar tiada", "Supaya solat dilewatkan", "Kerana debu tidak boleh digunakan", "Kerana air lebih mahal"], 0,
     "Tayammum hanya dibenarkan apabila air benar-benar tiada atau tidak boleh digunakan, maka air mesti dicari terlebih dahulu.", "4.10.3", kbat=True),
]

if __name__ == "__main__":
    out = Path(__file__).with_name("bank_tayammum.json")
    out.write_text(json.dumps(BANK, ensure_ascii=False, indent=1), encoding="utf-8")
    from collections import Counter
    print(Counter(b["set"] for b in BANK), "jumlah", len(BANK))
