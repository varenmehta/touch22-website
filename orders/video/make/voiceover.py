"""Add the Hindi voiceover to the showcase video.

Reads the timed lines from ../hindi-voiceover-script.md, voices each one with
edge-tts (hi-IN-SwaraNeural), checks that no line runs into the next step,
then places each line at its timestamp, ducks the music under the voice and
muxes it onto the silent video.

  pip install edge-tts
  python3 voiceover.py [work_dir]      # needs ffmpeg; uses $HTTPS_PROXY if set
"""
import os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEO_DIR = os.path.dirname(HERE)
SCRIPT = os.path.join(VIDEO_DIR, "hindi-voiceover-script.md")
SILENT = os.path.join(VIDEO_DIR, "Touch22-Order-Desk-showcase.mp4")
MUSIC = os.path.join(VIDEO_DIR, "Touch22-Order-Desk-showcase-music.mp4")
OUT = os.path.join(VIDEO_DIR, "Touch22-Order-Desk-showcase-hindi.mp4")
VOICE = "hi-IN-SwaraNeural"
MIN_GAP = 0.5  # seconds of quiet before the next line starts


def duration(path):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]))


def speech_end(path):
    """Time the speech stops, ignoring the trailing silence edge-tts adds."""
    log = subprocess.run(["ffmpeg", "-i", path, "-af", "silencedetect=n=-40dB:d=0.2", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]
    total = duration(path)
    return starts[-1] if starts and total - starts[-1] < 1.5 else total


def main():
    work = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "vo")
    os.makedirs(work, exist_ok=True)
    lines = []
    for row in open(SCRIPT, encoding="utf-8"):
        m = re.match(r"\| (\d+):(\d+) \| (.*?) \| (.*?) \|$", row.strip())
        if m:
            lines.append((int(m[1]) * 60 + int(m[2]), m[3], m[4]))

    video_len = duration(SILENT)
    clips, ok = [], True
    for i, (t, step, text) in enumerate(lines):
        clip = os.path.join(work, f"line{i:02d}.mp3")
        if not os.path.exists(clip):
            cmd = ["edge-tts", "--voice", VOICE, "--text", text, "--write-media", clip]
            if os.environ.get("HTTPS_PROXY"):
                cmd += ["--proxy", os.environ["HTTPS_PROXY"]]
            subprocess.run(cmd, check=True, capture_output=True)
        end = t + speech_end(clip)
        limit = lines[i + 1][0] if i + 1 < len(lines) else video_len
        fits = end + MIN_GAP <= limit
        ok &= fits
        print(f"{t:4d}s  {step:26s} ends {end:6.1f}s  next {limit:6.1f}s  {'ok' if fits else 'TOO LONG'}")
        clips.append((t, clip))
    if not ok:
        sys.exit("Some lines run into the next step. Shorten them in the script.")

    # Voice track: every line delayed to its timestamp.
    inputs, chains = [], []
    for n, (t, clip) in enumerate(clips):
        inputs += ["-i", clip]
        chains.append(f"[{n + 2}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={t * 1000}:all=1[v{n}]")
    vmix = "".join(f"[v{n}]" for n in range(len(clips)))
    graph = ";".join(chains + [
        f"{vmix}amix=inputs={len(clips)}:normalize=0,volume=1.6,asplit=2[voice][key]",
        "[1:a]aresample=48000,volume=0.9[music]",
        # Music dips about 12 dB while she speaks and eases back in between lines.
        "[music][key]sidechaincompress=threshold=0.02:ratio=8:attack=40:release=900:makeup=1[ducked]",
        "[ducked][voice]amix=inputs=2:normalize=0,alimiter=limit=0.95[out]",
    ])
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", SILENT, "-i", MUSIC, *inputs,
                    "-filter_complex", graph, "-map", "0:v", "-map", "[out]",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                    "-t", f"{video_len:.3f}", "-movflags", "+faststart", OUT], check=True)
    print("Wrote", OUT)


if __name__ == "__main__":
    main()
