#!/usr/bin/env bash
# Build ulang video: ./build.sh  (butuh: ffmpeg, python3, pip install edge-tts pycairo numpy scipy)
set -euo pipefail
cd "$(dirname "$0")"
export BUILD=${BUILD:-build}
python3 tts.py "$BUILD"
python3 audio.py "$BUILD/mix.wav"
python3 render.py "$BUILD/video.mp4" "$BUILD/mix.wav"
python3 cover.py cover.png && ffmpeg -v error -y -i cover.png -q:v 2 cover.jpg
cp "$BUILD/video.mp4" motor-driver-explainer.mp4
echo "Selesai: motor-driver-explainer.mp4"
