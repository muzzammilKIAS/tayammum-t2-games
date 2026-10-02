"""Jana audio sebutan bagi set guru menggunakan Piper TTS (suara ar_JO-kareem-medium), kemudian tukar kepada AAC (.m4a).

Piper tidak deterministik: setiap klip disemak dengan faster-whisper (bahasa Arab) dan hanya klip yang dikenal pasti
dengan tepat disimpan. Klip sedia ada TIDAK ditulis ganti; padam fail .m4a untuk menjana semula.

Teks Arab bervokal disalin daripada modul RC3411. Jalankan:  python3 scripts/build-audio.py
"""
import subprocess, sys, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public/media/akhlak"
VOICE = Path.home() / "Desktop/03 PROJEK & PERISIAN/PROTOTYPE/umt3033_flutter/scripts/.piper_voices/ar_JO-kareem-medium.onnx"
CLIPS = {
    "amanah": "الْأَمَانَةُ",
    "tawakkul": "التَّوَكُّلُ",
    "hadis-jiran": "مَنْ كَانَ يُؤْمِنُ بِاللهِ وَالْيَوْمِ الْآخِرِ فَلْيُكْرِمْ جَارَهُ",
}

from piper import PiperVoice  # noqa: E402

voice = PiperVoice.load(str(VOICE), config_path=str(VOICE) + ".json")
OUT.mkdir(parents=True, exist_ok=True)
for name, text in CLIPS.items():
    if (OUT / f"{name}.m4a").exists():
        print(name, "sedia ada, dilangkau"); continue
    wav = OUT / f"{name}.wav"
    with wave.open(str(wav), "wb") as wf:
        voice.synthesize_wav(text, wf)
    m4a = OUT / f"{name}.m4a"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-af", "adelay=250|250,apad=pad_dur=0.3", "-c:a", "aac", "-b:a", "96k", str(m4a)], check=True)
    wav.unlink()
    print(name, m4a.stat().st_size, "bait")
