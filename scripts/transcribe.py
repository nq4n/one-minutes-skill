import sys
from faster_whisper import WhisperModel

# usage: python scripts/transcribe.py <audio_path> [model_size] [language]
# example: python scripts/transcribe.py C:\tmp\audio.wav small ar

def main():
    if len(sys.argv) < 2:
        print("Missing audio_path", file=sys.stderr)
        sys.exit(1)

    audio_path = sys.argv[1]
    model_size = sys.argv[2] if len(sys.argv) >= 3 else "small"
    language = sys.argv[3] if len(sys.argv) >= 4 else None

    # cpu only (free)
    model = WhisperModel(model_size, device="cpu", compute_type="int8")

    segments, info = model.transcribe(
        audio_path,
        language=language,        # "ar" or "en" (optional)
        vad_filter=True,          # يقلل الصمت
    )

    out = []
    for seg in segments:
        out.append(seg.text.strip())

    print("\n".join(out).strip())

if __name__ == "__main__":
    main()
