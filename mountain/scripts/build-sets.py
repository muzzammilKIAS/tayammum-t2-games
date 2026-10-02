"""Jana content/sets.json: set soalan guru yang dibina khusus untuk satu pelajaran.

Semua teks Arab disalin daripada modul RC3411 (Kitab al-Lughah al-'Arabiyyah al-Rabbaniyyah 1),
Unit 7-9. Penjelasan dalam Bahasa Melayu ditulis oleh guru.
Jalankan:  python3 scripts/build-sets.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
topics = {t["id"]: t["title"] for t in json.loads((ROOT / "content/topics.json").read_text(encoding="utf-8"))}
M = "media/akhlak/"


def mc(topic, prompt, options, answer, explanation, *, ar=None, ms=None, rtl=True, image=None, alt=None, audio=None, qtype="multiple-choice"):
    q = {"topic": topic, "type": qtype, "prompt": prompt, "options": options, "optionsDir": "rtl" if rtl else "ltr",
         "answer": answer, "explanation": explanation}
    if ar: q["questionAr"] = ar
    if ms: q["questionMs"] = ms
    if image: q["image"], q["imageAlt"] = M + image, alt
    if audio: q["audio"] = M + audio
    return q


def arrange(topic, sequence, explanation):
    return {"topic": topic, "type": "arrange", "prompt": "Susun perkataan menjadi ayat", "sequence": sequence, "explanation": explanation}


ROUND1 = [
    mc(7, "Tekan butang, dengar sebutan dengan teliti", ["الْأَمَانَةُ", "الْفَطَانَةُ", "الْخِيَانَةُ", "التَّبْلِيغُ"], 0,
       "الْأَمَانَةُ = Dipercayai (amanah). Jangan keliru dengan الْخِيَانَةُ (khianat), iaitu lawannya.",
       ms="Perkataan manakah yang anda dengar?", audio="amanah.m4a", qtype="vocabulary"),
    mc(7, "Lihat gambar, kemudian pilih sifat yang betul", ["الصِّدْقُ", "الْأَمَانَةُ", "التَّبْلِيغُ", "الْفَطَانَةُ"], 1,
       "Contoh dalam modul: أَرُدُّ مَا وَجَدْتُهُ إِلَى صَاحِبِهِ, iaitu memulangkan barang yang dijumpai kepada pemiliknya. Ini sifat الْأَمَانَةُ.",
       ms="Ali memulangkan dompet yang dijumpainya kepada pemiliknya.", image="dompet.svg",
       alt="Seorang pelajar menghulurkan dompet yang dijumpai kepada pemiliknya"),
    mc(7, "Apakah maksud perkataan ini?", ["Cerdik", "Menyampaikan", "Dipercayai", "Bercakap Benar"], 0,
       "الْفَطَانَةُ = Cerdik. Empat sifat wajib Rasul: الصِّدْقُ، الْأَمَانَةُ، التَّبْلِيغُ، الْفَطَانَةُ.",
       ar="الْفَطَانَةُ", rtl=False, qtype="vocabulary"),
    mc(7, "Pilih jawapan yang betul", ["الْكَذِبُ", "الْخِيَانَةُ", "الْكِتْمَانُ", "الْبَلَادَةُ"], 0,
       "Teks modul: ضِدُّ الصِّدْقِ الْكَذِبُ، وَضِدُّ الْأَمَانَةِ الْخِيَانَةُ.", ar="مَا ضِدُّ الصِّدْقِ؟"),
    mc(7, "Pilih jawapan yang betul", ["الْكَذِبُ", "الْخِيَانَةُ", "الْكِتْمَانُ", "الْبَلَادَةُ"], 1,
       "Lawan الْأَمَانَةُ ialah الْخِيَانَةُ (khianat). الْكَذِبُ pula lawan bagi الصِّدْقُ.", ar="مَا ضِدُّ الْأَمَانَةِ؟"),
    arrange(7, ["مُحَمَّدٌ", "صَادِقٌ", "لَا", "يَكْذِبُ"],
            "مُحَمَّدٌ صَادِقٌ لَا يَكْذِبُ: Muhammad seorang yang benar, tidak berdusta. لَا diletakkan terus sebelum فعل."),
    mc(7, "Lengkapkan ayat", ["يُبَلِّغُ", "صَادِقٌ", "أَمِينٌ", "فَطِنٌ"], 0,
       "الرَّسُولُ يُبَلِّغُ رِسَالَةَ رَبِّهِ: Rasul menyampaikan risalah Tuhannya (sifat التَّبْلِيغُ).",
       ar="الرَّسُولُ ＿＿＿ رِسَالَةَ رَبِّهِ.", qtype="fill-blank"),
    mc(7, "Pilih jawapan yang betul", ["نَبِيٌّ فَطِنٌ", "نَبِيٌّ الْفَطِنُ", "رَسُولٌ الْأَمِينُ"], 0,
       "صفة mengikut موصوف dari segi ma'rifah/nakirah: نَبِيٌّ فَطِنٌ (kedua-duanya nakirah) dan الرَّسُولُ الأَمِينُ (kedua-duanya ma'rifah).",
       ms="Frasa اسم + صفة manakah yang betul dari segi ma'rifah dan nakirah?"),
    mc(8, "Tekan butang, dengar sebutan dengan teliti", ["Berserah kepada Allah", "Bersyukur", "Ketaatan", "Rasa Takut kepada Allah"], 0,
       "التَّوَكُّلُ = Berserah kepada Allah. Bersyukur = الشُّكْرُ, Ketaatan = الطَّاعَةُ, Rasa Takut kepada Allah = التَّقْوَى.",
       ms="Apakah maksud perkataan yang anda dengar?", audio="tawakkul.m4a", rtl=False, qtype="vocabulary"),
    mc(8, "Apakah maksud perkataan ini?", ["Rasa Takut kepada Allah", "Kecintaan / Kasih Sayang", "Ketaatan", "Bersyukur"], 0,
       "التَّقْوَى = Rasa Takut kepada Allah. الْمَحَبَّةُ = Kecintaan, الطَّاعَةُ = Ketaatan, الشُّكْرُ = Bersyukur.",
       ar="التَّقْوَى", rtl=False, qtype="vocabulary"),
    mc(8, "Pilih jawapan yang betul", ["لَا أَعْصِي اللهَ.", "أَنَا أُطِيعُ اللهَ.", "أَنَا مُؤْمِنٌ.", "أَتَوَكَّلُ عَلَى اللهِ."], 0,
       "Ayat nafi menggunakan لَا + فعل: لَا أَعْصِي اللهَ. Tiga ayat lain ialah ayat mutsbatah.",
       ms="Ayat manakah ialah ayat nafi (اَلْمَنْفِيَّةُ)?"),
    arrange(8, ["لَا", "أَعْصِي", "اللهَ"], "لَا أَعْصِي اللهَ: Aku tidak menderhakai Allah. Pola nafi: لَا + فعل."),
    mc(9, "Lihat gambar, kemudian pilih perkataan yang betul", ["الْجَدُّ", "الْجَدَّةُ", "الْعَمُّ", "الْخَالُ"], 0,
       "الْجَدُّ = Datuk, الْجَدَّةُ = Nenek.", ms="Siapakah dalam gambar ini?", image="datuk.svg",
       alt="Seorang datuk berjanggut putih memegang tongkat bersama cucunya"),
    mc(9, "Lihat salasilah, kemudian pilih perkataan yang betul", ["الْخَالُ", "الْعَمُّ", "الْجَدُّ", "الْأَخُ"], 0,
       "Saudara lelaki ibu = الْخَالُ (Pak Cik sebelah ibu). Saudara lelaki ayah = الْعَمُّ (Pak Cik sebelah ayah).",
       ms="Siapakah yang bertanda « ? » dalam salasilah ini?", image="salasilah.svg",
       alt="Rajah salasilah: saudara lelaki ibu ditanda dengan tanda soal"),
    mc(9, "Frasa ini ialah …", ["التركيب الإضافي", "التركيب الإسنادي"], 0,
       "رَسُولُ اللهِ = مضاف + مضاف إليه dan bukan ayat lengkap. Bandingkan مُحَمَّدٌ رَسُولُ اللهِ yang merupakan ayat lengkap (إسنادي).",
       ar="رَسُولُ اللهِ"),
    mc(9, "Dengar hadis, kemudian lengkapkan", ["جَارَهُ", "صَدِيقَهُ", "مُعَلِّمَهُ", "أَبَاهُ"], 0,
       "Hadis riwayat al-Bukhari dan Muslim (modul Unit 9): فَلْيُكْرِمْ جَارَهُ, iaitu hendaklah dia memuliakan jirannya.",
       ar="مَنْ كَانَ يُؤْمِنُ بِاللهِ وَالْيَوْمِ الْآخِرِ فَلْيُكْرِمْ ＿＿＿", audio="hadis-jiran.m4a", qtype="fill-blank"),
]

ROUND2 = [
    mc(7, "Lengkapkan frasa sifat (cerdik)", ["فَطِنٌ", "الْفَطِنُ"], 0,
       "نَبِيٌّ ialah nakirah, maka صفة juga nakirah: نَبِيٌّ فَطِنٌ.", ar="نَبِيٌّ ＿＿＿", qtype="fill-blank"),
    mc(7, "Pilih jawapan yang betul", ["الْأَمَانَةُ", "الصِّدْقُ", "التَّبْلِيغُ", "الْفَطَانَةُ"], 0,
       "ضِدُّ الْأَمَانَةِ الْخِيَانَةُ.", ms="الْخِيَانَةُ ialah lawan bagi …"),
    mc(8, "Pilih jawapan yang betul", ["أَنَا أُطِيعُ اللهَ.", "لَا أَعْصِي اللهَ.", "لَيْسَ النَّبِيُّ كَاذِبًا."], 0,
       "أَنَا أُطِيعُ اللهَ ialah ayat mutsbatah (اسم + فعل). Dua ayat lain ialah ayat nafi (لَا / لَيْسَ).",
       ms="Ayat manakah ialah ayat mutsbatah (اَلْمُثْبَتَةُ)?"),
    arrange(9, ["أَبِي", "رَجُلٌ", "كَرِيمٌ"], "أَبِي رَجُلٌ كَرِيمٌ: Ayahku seorang lelaki yang pemurah (teks modul Unit 9)."),
    mc(9, "Frasa ini ialah …", ["التركيب الإسنادي", "التركيب الإضافي"], 0,
       "أسرتي سعيدة ialah ayat lengkap (مبتدأ + خبر), maka ia إسنادي.", ar="أسرتي سعيدة"),
    mc(9, "Apakah maksud perkataan ini?", ["Pak Cik (sebelah ayah)", "Pak Cik (sebelah ibu)", "Datuk", "Saudara lelaki"], 0,
       "الْعَمُّ = Pak Cik sebelah ayah; الْخَالُ = Pak Cik sebelah ibu.", ar="الْعَمُّ", rtl=False, qtype="vocabulary"),
]

SETS = [
    {"id": "akhlak-7-9", "title": "Ulang Kaji Akhlak", "subtitle": "Pusingan 1 · Unit 7–9", "round": 1, "questions": ROUND1},
    {"id": "akhlak-7-9-tebus", "title": "Pusingan Tebus", "subtitle": "Pusingan 2 · Unit 7–9", "round": 2, "questions": ROUND2},
]
for s in SETS:
    s["topicIds"] = sorted({q["topic"] for q in s["questions"]})
    s["topics"] = [topics[i] for i in s["topicIds"]]
    for q in s["questions"]:
        q["topicTitle"] = topics[q["topic"]]

(ROOT / "content/sets.json").write_text(json.dumps(SETS, ensure_ascii=False, indent=1), encoding="utf-8")
print({s["id"]: len(s["questions"]) for s in SETS})
