"""Jana content/sets.json (set Tayammum) daripada 00_bank/bank_tayammum.json.

Soalan, pilihan, jawapan dan penjelasan disalin sebagaimana ada. Satu-satunya perubahan teks:
penanda semakan guru "[SAHKAN ...]" dibuang daripada penjelasan supaya tidak dipaparkan kepada pelajar
(senarai penanda dicetak di bawah untuk disemak guru).
Jalankan:  python3 scripts/build-tayammum.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BANK = ROOT.parent / "00_bank" / "bank_tayammum.json"
TOPIC_TITLE = "التَّيَمُّمُ"
FLAG = re.compile(r"\s*\[SAHKAN[^\]]*\]")

bank = json.loads(BANK.read_text(encoding="utf-8"))
flagged = []


def clean(item):
    text = item["explanation"]
    if FLAG.search(text):
        flagged.append((item["id"], FLAG.search(text).group(0).strip()))
    return FLAG.sub("", text).strip()


def convert(item):
    base = {"topic": 1, "bankId": item["id"], "sk": item["sk"], "explanation": clean(item), "topicTitle": TOPIC_TITLE}
    if item["type"] == "arrange":
        # UI arrange memaparkan prompt; questionMs digunakan oleh laporan guru.
        return {**base, "type": "arrange", "prompt": item["q"], "questionMs": item["q"], "sequence": item["sequence"]}
    assert 0 <= item["answer"] < len(item["options"]) and len(set(item["options"])) == len(item["options"]), item["id"]
    return {**base, "type": "multiple-choice", "prompt": "Pilih jawapan yang betul", "questionMs": item["q"],
            "options": item["options"], "optionsDir": "ltr", "answer": item["answer"]}


def make(set_key, sid, title, subtitle, rnd):
    qs = [convert(x) for x in bank if x["set"] == set_key]
    return {"id": sid, "title": title, "subtitle": subtitle, "round": rnd, "questions": qs,
            "topicIds": [1], "topics": [TOPIC_TITLE]}


SETS = [
    make("asas", "tayammum-asas", "Tayammum: Asas", "Pusingan 1 · SK 4.10 Tayammum", 1),
    make("tebus", "tayammum-tebus", "Pusingan Tebus", "Pusingan 2 · Pemulihan Tayammum", 2),
    make("klinik", "tayammum-klinik", "Klinik Fiqah", "Pusingan 3 · Pengayaan KBAT Tayammum", 3),
]
(ROOT / "content/sets.json").write_text(json.dumps(SETS, ensure_ascii=False, indent=1), encoding="utf-8")
print({s["id"]: len(s["questions"]) for s in SETS})
print("Penanda [SAHKAN] dibuang daripada paparan:", flagged)
