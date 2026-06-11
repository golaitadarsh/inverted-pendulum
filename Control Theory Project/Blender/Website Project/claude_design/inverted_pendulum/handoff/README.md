# Handoff — Inverted Pendulum demo · Claude Code package

You (Claude Code, with Blender connected) are going to build the **animated walkthrough video** that completes the project. The interactive HTML demo is done. This folder is everything you need to render the video.

## What's already done

- `Prototype.html` — the live interactive demo (Three.js-replacement + ODE/RK4 in JS). Open it to see the target aesthetic.
- `index.html` — pass-1 design canvas with the system + wireframes. Reference for palette, type, chrome.
- `Inverted Pendulum — Standalone.html` — single-file offline build of the prototype.

## What you're building

A **25–30 second screen-recording-style video** that walks through the three modes — **Kit → Run → Studio (Diagram → Plots → Math)** — using the real Blender scene the user already has loaded. Output as `walkthrough.mp4` (1920×1080 · 30fps · H.264).

## Files in this folder

| File | Purpose |
|---|---|
| `STORYBOARD.md` | Shot list with exact timings, camera moves, what's on screen frame-by-frame |
| `BLENDER_SPEC.md` | Render settings, camera intrinsics, lights, materials, color pipeline |
| `animate.py` | bpy automation script — keyframes camera + objects, sets up render, runs export |
| `theta_history.json` | Sampled (t, θ) from the live JS sim — drive the pendulum motion from this so the video matches the demo physics 1:1 |
| `overlays/` | HTML/SVG snippets to composite on top of the rendered frames (LAB title block, mode badges, sub-pills, equations). These are the same chrome as the prototype, rendered crisp at video resolution |
| `compose.sh` | ffmpeg recipe that takes Blender's PNG sequence + the SVG overlays and produces the final MP4 |
| `INTEGRATION.md` | Optional: how to drop the resulting MP4 (or stills from it) back into the prototype as a hero/loop |

## Inputs you have (Blender scene)

The user already loaded these objects — use these exact names. Where the storyboard references something not in this list, ask the user (e.g. the pendulum rod itself may be a child of `mass` or a separate object).

```
12V_10A                 — power brick
arduino_uno             — controller PCB
base_support_stand      — bottom of the rig
motor_support_stand     — stand the motor is bolted to
encoder_support_stand   — stand the encoder is bolted to
mass                    — pendulum bob (and maybe rod — confirm with user)
breadboard
encoder
motor
light                   — primary fill light (you may add more — see BLENDER_SPEC.md)
camera                  — primary cam (you'll keyframe its location/rotation)
```

## Order of operations

1. Read `STORYBOARD.md` end-to-end so the timing model is in your head.
2. Read `BLENDER_SPEC.md` and apply the render/world/output settings to the scene.
3. Run `animate.py` inside Blender (or paste it into the scripting workspace). It assumes the named objects above exist; it will warn if any are missing.
4. Render the PNG sequence (`render/####.png`).
5. Run `compose.sh` to stitch frames + overlays into `walkthrough.mp4`.
6. Show the user the result; iterate.

## Aesthetic constraints (non-negotiable)

- **Palette**: `#0E0E0C` lab dark, `#F4F1E8` ink on dark, `#D4FF3A` acid accent. No other colors.
- **Type in overlays**: Geist 900 (display), Instrument Serif italic (accent voice), Geist Mono (UI labels).
- **Chrome motif**: bracket corners `[ ]` on panels, mono caps `[ NUM ] · LABEL` for headers.
- **Motion**: cubic-bezier ease-out (`.2, .7, .3, 1`) on every camera move and panel slide. No bounces. No springs. No fade-blacks longer than 240 ms.
- **What NOT to do**: no logos, no music drops, no glow/bloom, no chromatic aberration, no "futuristic HUD" overlays beyond what the prototype already shows. Restraint is the brand.
