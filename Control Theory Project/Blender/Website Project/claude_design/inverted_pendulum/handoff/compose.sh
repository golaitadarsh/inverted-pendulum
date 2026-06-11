#!/usr/bin/env bash
# compose.sh — stitch Blender PNG frames + SVG overlays into walkthrough.mp4
#
# Prereqs: ffmpeg with libx264, librsvg (for rsvg-convert) or Inkscape.
# Run from this handoff/ folder after Blender finishes rendering to ./render/

set -euo pipefail

FPS=30
W=1920
H=1080
OUT=walkthrough.mp4

if [ ! -d render ]; then
  echo "ERROR: ./render/ not found. Run animate.py and render the sequence first." >&2
  exit 1
fi

# Step 1 — rasterize each timed overlay SVG to a frame range.
#
# overlays/manifest.json describes which SVGs are visible at which frames.
# Read OVERLAYS.md for the schema. Here we'll just use the pre-rendered PNGs
# if you've already produced them; otherwise rasterize on the fly.

mkdir -p overlay_frames
for f in overlays/*.svg; do
  base=$(basename "$f" .svg)
  if [ ! -f "overlay_frames/${base}.png" ]; then
    if command -v rsvg-convert >/dev/null; then
      rsvg-convert -w $W -h $H "$f" -o "overlay_frames/${base}.png"
    else
      inkscape "$f" --export-type=png --export-filename="overlay_frames/${base}.png" -w $W -h $H
    fi
  fi
done

# Step 2 — encode Blender PNG sequence to an intermediate.
ffmpeg -y -framerate $FPS -i render/%04d.png \
  -c:v libx264 -crf 18 -pix_fmt yuv420p -preset slow \
  -movflags +faststart \
  base.mp4

# Step 3 — overlay each chrome layer with its time window.
# Claude Code: read overlays/manifest.json and build a filter_complex chain.
# For a single static overlay (the persistent LAB title block + mode pills),
# the simplest invocation is:
#
#   ffmpeg -i base.mp4 -i overlay_frames/chrome_persistent.png \
#     -filter_complex "[0:v][1:v] overlay=0:0:enable='between(t,0,30)'" \
#     -c:v libx264 -crf 18 -pix_fmt yuv420p walkthrough.mp4
#
# For multiple timed overlays, chain `overlay` filters. Example with three:
#
#   ffmpeg -i base.mp4 \
#     -i overlay_frames/kit_callout_arduino.png \
#     -i overlay_frames/diagram_panel.png \
#     -i overlay_frames/closing_line.png \
#     -filter_complex "
#       [0:v][1:v] overlay=0:0:enable='between(t,1.5,2.1)' [v1];
#       [v1][2:v] overlay=0:0:enable='between(t,20.6,23.0)' [v2];
#       [v2][3:v] overlay=0:0:enable='between(t,29.3,30.0)' [out]
#     " -map "[out]" -c:v libx264 -crf 18 -pix_fmt yuv420p $OUT

echo
echo "▸ Base (no overlays) → base.mp4"
echo "▸ For final composite, expand the filter_complex above per manifest.json."
echo
echo "Suggested next step:"
echo "  ffmpeg -i base.mp4 -i overlay_frames/chrome.png \\"
echo "    -filter_complex '[0:v][1:v]overlay=0:0' \\"
echo "    -c:v libx264 -crf 18 -pix_fmt yuv420p -preset slow -movflags +faststart \\"
echo "    $OUT"
