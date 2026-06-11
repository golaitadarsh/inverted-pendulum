# Blender Spec — Inverted Pendulum walkthrough

Apply these settings BEFORE rendering. `animate.py` sets most of them programmatically, but the manual checks are listed too.

## Render engine

- **Engine**: Cycles (CPU+GPU OptiX/CUDA if available). Eevee Next is acceptable for previews but final render = Cycles.
- **Samples**: 256 (viewport 32). Denoiser: OpenImageDenoise, Prefilter: Accurate.
- **Light paths**: max bounces total 8, diffuse 4, glossy 4, transmission 8, transparency 8.
- **Film**:
  - Exposure: 0.0
  - Transparent: **off** (we want the lab dark as the BG)
  - Pixel filter: Gaussian, 1.5 px
- **Color management**:
  - Display: sRGB
  - View transform: **AgX**
  - Look: AgX Base Low Contrast
  - Exposure: 0
  - Gamma: 1
- **Resolution**: 1920 × 1080, 100% scale.
- **Frame range**: 1 – 900 (Blender is 1-indexed; storyboard times in seconds × 30).
- **Output format**: PNG, RGB, 16-bit color depth, compression 50. Sequence to `render/####.png`.

## World

- Background: pure flat `#0E0E0C` (`Background` shader with linear-RGB `0.0029, 0.0029, 0.0023` after sRGB-to-linear).
- World strength: 0.15 (very subtle ambient, mostly to seat the parts).

## Lights

Add or update these alongside the existing `light`:

| Name | Type | Location | Rotation | Energy | Color | Notes |
|---|---|---|---|---|---|---|
| `key`  | Area, 0.6 × 0.6 m | (1.2, -1.5, 1.8) | aim at origin | 800 W | warm-white #FFF1DC | primary; soft shadow |
| `fill` | Area, 1.0 × 1.0 m | (-1.5, 0.6, 1.0) | aim at origin | 220 W | cool-white #C8D8FF | low fill, kills hard contrast |
| `rim`  | Spot, 45° | (0.0, 1.8, 1.4) | aim at origin | 350 W | acid #D4FF3A | **animated** — energy 0 until frame 420 (PD catch), then 350 W; back to 0 at 510 |
| `light` (existing) | leave settings, but lower to 50% energy so the new key/fill take over |

> Tip: Group the three new lights in a collection called `cinematic_lights` so the user can hide them for stills.

## Materials (key adjustments)

Don't repaint anything aggressively — these are calibration nudges so the rendered parts read in the same monochrome+acid system as the prototype.

- `mass` (the bob): Principled BSDF, base color near-white `#E8E5DC`, Roughness 0.35, Metallic 0.7. Add an **emission slot** at color `#D4FF3A`, strength **driven by frame** (see `animate.py`) — stays at 0 except for a 200 ms pulse at the PD-catch moment.
- Rod (if separate object): brushed aluminium — base `#C7C3BA`, Metallic 1.0, Roughness 0.5, Anisotropy 0.7 along the rod's long axis.
- `arduino_uno`, `motor`, `encoder`, `breadboard`: keep your existing materials; just make sure Roughness ≥ 0.4 so they don't blow out under the key light.
- `12V_10A`: matte black, base `#1A1916`, Roughness 0.6.
- Stands (`*_support_stand`): aluminium profile look — base `#A8A49B`, Metallic 0.9, Roughness 0.45.
- Ground plane: if you don't have one, add a 4 × 4 m plane at z = 0 named `ground_cutting_mat`:
  - Base color `#0E0E0C` mixed with a Voronoi-driven grid texture (24 mm major, 5 mm minor) of color `rgba(244,241,232,0.06)` — gives the subtle cutting-mat read without being literal.
  - Roughness 0.85, no specular.

## Camera

Replace the existing `camera` settings with these intrinsics:

- Type: Perspective
- Focal length: **35 mm** (wide enough for the rig, tight enough not to distort the rod)
- Sensor: 36 × 24 mm (full-frame)
- DOF: **on**, aperture f/2.8, focus distance driven each frame to track the pendulum's bob (see `animate.py`)

The camera path is fully keyframed in `animate.py`. Key poses:

| frame | location (m) | rotation_euler (deg) | notes |
|---:|---|---|---|
| 1   | (0, 0, 2.6)        | (0, 0, 0)        | Top-down ortho-feel. (Camera is still Perspective; we just stand it tall.) |
| 240 | (0, 0, 2.6)        | (0, 0, 0)        | Hold for KIT scene. |
| 270 | (1.3, -1.3, 1.0)   | (62, 0, 45)      | Ease-out tilt to 3/4. |
| 420 | (1.2, -1.4, 0.7)   | (75, 0, 42)      | Slight push-in during swing-up. |
| 600 | (1.05, -1.25, 0.65)| (76, 0, 42)      | Holds for Studio. |
| 870 | (1.02, -1.22, 0.65)| (76, 0, 42)      | Final 2% dolly. |

All segments use **F-curve interpolation: Bezier, handle type Auto Clamped**, then in the Graph Editor set easing to **Ease Out**. The script applies this.

## Compositor

Add these nodes after `Render Layers`:

1. **Glare** node — type *Streaks*, threshold 1.2, mix -0.85 (subtle, mostly disabled). Skip if it feels showy.
2. **Vignette** — gradient mask + Multiply, strength 0.18.
3. **Film grain** — Noise texture, Mix mode Soft Light, strength 0.04. Animated on `#frame` so it shimmers.
4. **Output**: File Output node writing `render/####.png` at 16-bit PNG.

## Pre-flight checks

Run these before the long render:

- [ ] `bpy.data.objects['mass']` (and every other named object) exists; if any are missing, animate.py prints a list and exits.
- [ ] `theta_history.json` is present in this folder.
- [ ] No object has a non-applied scale ≠ (1,1,1) — apply scale to everything (`Ctrl+A → Scale`) or the keyframed animations will drift.
- [ ] Camera's `Track To` constraint (if any) is removed — we keyframe rotation directly.
- [ ] Test-render frames `1, 240, 270, 420, 600, 870` (six poses) at 25% scale. If those look right, kick the full sequence.

## Performance target

On an RTX-3060-class GPU, expect ~3.5 s/frame at the settings above = ~52 min for the full 900 frames. If that's too long, drop samples to 128 and pixel filter to 1.0 px — quality loss is invisible at 1080p video.
