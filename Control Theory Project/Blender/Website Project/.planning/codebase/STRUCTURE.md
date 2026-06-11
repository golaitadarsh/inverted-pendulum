# STRUCTURE

## Top-level directory tree (Website Project/ at depth 2)

```
Website Project/
├── .DS_Store
├── .planning/
│   └── codebase/
│       ├── ARCHITECTURE.md            (this map)
│       └── STRUCTURE.md
├── assets/                            per-part GLBs (originals, not used at runtime)
│   ├── .DS_Store
│   ├── CT_Project.pdf                 source paper (Patel/Kurle/Golait/Kanwat 2022)
│   ├── 12V_10A.glb
│   ├── arduino_uno.glb
│   ├── base_support_stand.glb
│   ├── breadboard.glb
│   ├── ct encoder coupler.glb
│   ├── ct motor coupler.glb
│   ├── cutting_mat.glb
│   ├── encoder.glb
│   ├── encoder_support_stand.glb
│   ├── mass_big_bolt_L.glb
│   ├── mass_big_bolt_U.glb
│   ├── mass_screw.glb
│   ├── mass_small_bolt.glb
│   ├── motor.glb
│   ├── motor_support_stand.glb
│   └── swinging_support_rod.glb
└── claude_design/
    ├── .DS_Store
    ├── inverted_pendulum.zip          archived design canvas bundle
    └── inverted_pendulum/
        ├── .DS_Store
        ├── .thumbnail
        ├── design-canvas.jsx          design-system canvas (JSX, not runtime)
        ├── ds-artboards.jsx
        ├── ds-primitives.jsx
        ├── pp-app.jsx
        ├── pp-modes.jsx
        ├── pp-physics.jsx
        ├── tweaks-panel.jsx
        ├── wf-artboards.jsx
        ├── index.html                 first-pass design canvas
        ├── Prototype.html             early single-file prototype
        ├── Inverted Pendulum.html
        ├── Inverted Pendulum - Standalone.html
        ├── screenshots/               loader/run/tweaks reference PNGs
        ├── uploads/                   reference imagery (Heintzmann + pasted)
        ├── handoff/                   Blender walkthrough-video deliverable
        │   ├── BLENDER_SPEC.md
        │   ├── INTEGRATION.md
        │   ├── README.md
        │   ├── STORYBOARD.md
        │   ├── animate.py
        │   ├── compose.sh
        │   └── theta_history.json
        └── site/                      LIVE 3D site (the runtime)
            ├── CLAUDE.md
            ├── app.js
            ├── index.html
            ├── styles.css
            └── assets/
                ├── pendulum.glb       composed Draco-compressed bundle (10.6 MB)
                └── scene_meta.json    world-bounds metadata (not loaded at runtime)
```

The runtime is everything under `claude_design/inverted_pendulum/site/`.
Everything else is upstream art (`assets/`), design exploration
(`claude_design/inverted_pendulum/*.{jsx,html}`), or the parallel
walkthrough-video deliverable (`claude_design/inverted_pendulum/handoff/`).

## `claude_design/inverted_pendulum/` file roles (every file, one line each)

- `claude_design/inverted_pendulum/.DS_Store` — macOS Finder metadata; ignore.
- `claude_design/inverted_pendulum/.thumbnail` — Finder/Penpot thumbnail blob.
- `claude_design/inverted_pendulum/index.html` — first-pass design canvas with system + wireframes (Heintzmann references, palette swatches); reference only, not the runtime.
- `claude_design/inverted_pendulum/Prototype.html` — early single-file Three-replacement + JS-RK4 prototype that the live site was derived from.
- `claude_design/inverted_pendulum/Inverted Pendulum.html` — intermediate design-canvas export.
- `claude_design/inverted_pendulum/Inverted Pendulum - Standalone.html` — 1.5 MB single-file offline build of the prototype, suitable for emailing.
- `claude_design/inverted_pendulum/design-canvas.jsx` — Penpot/figma-style design-system source (49 KB) covering the whole canvas.
- `claude_design/inverted_pendulum/ds-artboards.jsx` — design-system artboards (component gallery layouts).
- `claude_design/inverted_pendulum/ds-primitives.jsx` — design-system primitives (tokens, type ramp, buttons, chrome).
- `claude_design/inverted_pendulum/pp-app.jsx` — prototype "app" frame layout (chrome, pills, panels).
- `claude_design/inverted_pendulum/pp-modes.jsx` — prototype mode states (43 KB) — KIT / RUN / STUDIO mockups.
- `claude_design/inverted_pendulum/pp-physics.jsx` — prototype physics-panel mockup (equations + plots layout).
- `claude_design/inverted_pendulum/tweaks-panel.jsx` — prototype tweaks-panel mockup (sliders, swatches, mode select).
- `claude_design/inverted_pendulum/wf-artboards.jsx` — wireframe artboards (low-fidelity layouts).
- `claude_design/inverted_pendulum/inverted_pendulum.zip` (one level up at `claude_design/`) — archived bundle of the design canvas.
- `claude_design/inverted_pendulum/screenshots/loader.png` — reference of the loader UI.
- `claude_design/inverted_pendulum/screenshots/run-after-manual.png` — reference of RUN mode after manual perturb.
- `claude_design/inverted_pendulum/screenshots/tweaks.png` — reference of the tweaks panel open.
- `claude_design/inverted_pendulum/uploads/heintzmann-*.png` (5 files) — Heintzmann editorial typography references that informed the type system.
- `claude_design/inverted_pendulum/uploads/pasted-*.png` (2 files) — ad-hoc pasted refs from the design session.

## `claude_design/inverted_pendulum/site/` file roles

- `claude_design/inverted_pendulum/site/index.html` — page shell (300 lines): meta + OG/Twitter cards, favicon, Geist/Instrument Serif fonts, `styles.css`, importmap (declared before modulepreloads), modulepreload for Three.js + addons, GLB preload, then DOM: `#loader`, `<canvas id="stage">`, `#hero`, top-left/top-right/bottom chrome, `#pills`, `#kit-callout`, `#sub-pills`, `#panel-diagram` / `#panel-plots` / `#panel-math`, `#tweaks`, `#tweaks-open`, `#share-frame`, `#toast`, and `<script type="module" src="app.js?v=debug2">`.
- `claude_design/inverted_pendulum/site/app.js` — 1097-line runtime: PHYS constants + derived θ0/Tt, `wrap()`, `controlVoltage()` (PD cascade vs energy-pump destabiliser), `rhs()` + `rk4()` + `physicsStep()` with NaN guard, renderer/scene/camera/controls/lights/IBL/gizmo/trail/ground setup, GLB load callback (pivot from encoder coupler bbox + hardcoded `(-0.20, 1.48, 0.07)` fallback, `baseQuat` rotates GLB `+X` to world `+Y` for θ=0 upright, `swingAxis = (0,0,-1)` for Blender `+Y` → three `-Z`, rod-length from rod-mesh bbox max-extent ≈ 1.36, reparent bob meshes into `_pendulum_pivot` group), `setMode`/`setSub` UI router + keyboard, KIT highlight cycle, camera tween, 2D-canvas plots (`drawPlot`, `drawPhase`, `drawPoleZero`), KPI tracker, main `frame()` loop, hero, click-to-perturb, share-frame compositor, tweaks panel + accent swatches, resize handler.
- `claude_design/inverted_pendulum/site/styles.css` — 494 lines: Claude design-system tokens (bone `#F5F3EE`, ink `#0A0A08`, accent `#D4FF3A` acid green), light theme, type ramps (Geist 900 display, Instrument Serif italic, Geist Mono caps), bracket chrome `[ ]`, loader/hero animations, panel/pill states, breakpoints.
- `claude_design/inverted_pendulum/site/CLAUDE.md` — site contributor brief (123 lines): file map, physics summary tied to paper, axis conventions, mode reference, performance notes (Draco decoder warming, importmap-before-modulepreload, `preserveDrawingBuffer`, NaN guard), Blender re-export Python snippet, mesh-name patterns (`isMassPart` regex, tip-probe `/^mass_big_bolt_U/`), dev server invocation.
- `claude_design/inverted_pendulum/site/assets/pendulum.glb` — composed, Draco-compressed GLB (10.6 MB) that the runtime loads. Contains all rig parts (motor, encoder, stands, base, breadboard, PSU, Arduino), the imported `cutting_mat`, and PolyHaven `metal_plate` / `metal_plate_02` textures (JPEG q80, 1024²). Cache-busted at fetch time via `?v=<minute>`.
- `claude_design/inverted_pendulum/site/assets/scene_meta.json` — 9.4 KB world-bounds + object metadata. Not loaded at runtime; useful for offline tooling.

## `claude_design/inverted_pendulum/handoff/` file roles

Parallel deliverable — a 25–30 second screen-recording-style walkthrough
video (`walkthrough.mp4`, 1920×1080 @ 30 fps) rendered from Blender. Not
part of the live site, but ships the same visual language.

- `claude_design/inverted_pendulum/handoff/README.md` — 60-line orientation: what's done, what to build, file table, Blender input objects (use exact names: `12V_10A`, `arduino_uno`, `base_support_stand`, `motor_support_stand`, `encoder_support_stand`, `mass`, `breadboard`, `encoder`, `motor`, `light`, `camera`), order of operations, aesthetic constraints (bone/dark/acid palette, Geist + Instrument Serif + Geist Mono, bracket chrome, cubic ease-out, no bloom/CA/HUD).
- `claude_design/inverted_pendulum/handoff/STORYBOARD.md` — 85-line shot list with frame-by-frame timings for KIT → RUN → STUDIO (Diagram → Plots → Math).
- `claude_design/inverted_pendulum/handoff/BLENDER_SPEC.md` — 98-line render contract: Cycles 256 samples + OpenImageDenoise, AgX color management, 1920×1080 frames 1–900, world `#0E0E0C`, three new lights (`key` 800 W warm area, `fill` 220 W cool area, `rim` 350 W acid spot animated 420→510), material nudges (bob with frame-driven emission pulse, brushed aluminium rod, matte black `12V_10A`), 35 mm full-frame camera with DOF + keyframed pose path (frames 1/240/270/420/600/870), compositor (Glare/Vignette/Film-grain), pre-flight checklist.
- `claude_design/inverted_pendulum/handoff/animate.py` — 348-line bpy automation script that sets render settings, builds the lights, applies materials, keyframes the camera, drives the pendulum from `theta_history.json`, and renders the PNG sequence.
- `claude_design/inverted_pendulum/handoff/theta_history.json` — sampled `(t, θ)` trace exported from the live JS sim, used by `animate.py` to drive `mass` rotation 1:1 with the prototype.
- `claude_design/inverted_pendulum/handoff/compose.sh` — 72-line ffmpeg recipe that stitches Blender's `render/####.png` PNG sequence with SVG overlays into `walkthrough.mp4` (1920×1080, 30 fps, H.264).
- `claude_design/inverted_pendulum/handoff/INTEGRATION.md` — 54-line note on dropping the resulting MP4 / stills back into the site (e.g. as a hero loop).

## `assets/` GLB inventory (per-part exports vs composed bundle)

Per-part GLBs exported one-object-at-a-time from `inverted_pendulum.blend`.
They are NOT loaded by the website at runtime — the runtime loads only the
single composed bundle at `claude_design/inverted_pendulum/site/assets/pendulum.glb`.
The per-part files are kept as upstream / sharing artifacts. Most carry the
full embedded scene data, which is why they're each ~105 MB.

| File | Size | Object role |
|---|---|---|
| `assets/arduino_uno.glb` | 105 MB | Arduino Uno PCB (controller). |
| `assets/breadboard.glb` | 105 MB | Breadboard + L298N driver + power bus. |
| `assets/12V_10A.glb` | 105 MB | 12 V · 10 A bench PSU brick. |
| `assets/motor.glb` | 105 MB | Brushed DC motor (RS-775). |
| `assets/motor_support_stand.glb` | 105 MB | 20×20 mm aluminium stand for motor. |
| `assets/encoder.glb` | 105 MB | 600 PPR quadrature optical encoder. |
| `assets/encoder_support_stand.glb` | 105 MB | 20×20 mm aluminium stand for encoder. |
| `assets/base_support_stand.glb` | 105 MB | Bottom plate of the rig. |
| `assets/ct motor coupler.glb` | 105 MB | Custom coupler — motor shaft to swing rod. |
| `assets/ct encoder coupler.glb` | 105 MB | Custom coupler — encoder shaft to swing rod (its bbox center is the runtime pivot when present). |
| `assets/swinging_support_rod.glb` | 105 MB | The rod itself (its bbox max-extent sets `rodLength ≈ 1.36`). |
| `assets/mass_big_bolt_U.glb` | 105 MB | Upper big bolt — also serves as the `tipProbe` for the trail (`/^mass_big_bolt_U/`). |
| `assets/mass_big_bolt_L.glb` | 105 MB | Lower big bolt. |
| `assets/mass_small_bolt.glb` | 105 MB | Small bolt of the bob assembly. |
| `assets/mass_screw.glb` | 105 MB | Bob screw. |
| `assets/cutting_mat.glb` | 11 MB | User-provided cutting-mat ground (~5.45 m), imported into the composed scene. |
| `assets/CT_Project.pdf` | 19 MB | Source paper (Patel, Kurle, Golait, Kanwat 2022) — the equation + parameter source of truth. |

Composed bundle that the runtime actually loads:

| File | Size | Notes |
|---|---|---|
| `claude_design/inverted_pendulum/site/assets/pendulum.glb` | 10.6 MB | Draco-compressed (level 6, position q14, normal q10, texcoord q12). All rig parts + cutting mat + PolyHaven `metal_plate` / `metal_plate_02` textures (JPEG q80, 1024²). Re-export via the `bpy.ops.export_scene.gltf(...)` snippet in `claude_design/inverted_pendulum/site/CLAUDE.md`. |

## Upstream Blender source location (../inverted_pendulum.blend relative to Website Project/)

The authoring Blender file is one level up from `Website Project/`:

- `../inverted_pendulum.blend` →
  `/Users/adarshgolait/Documents/Claude Files/College Projects/Control Theory Project/Blender/inverted_pendulum.blend`
  (56.6 MB)
- `../inverted_pendulum.blend1` →
  `/Users/adarshgolait/Documents/Claude Files/College Projects/Control Theory Project/Blender/inverted_pendulum.blend1`
  (66.6 MB) — automatic Blender backup of the previous save.

That `.blend` is the source for:
- the per-part GLBs in `Website Project/assets/*.glb`,
- the composed `Website Project/claude_design/inverted_pendulum/site/assets/pendulum.glb` (via the documented `bpy.ops.export_scene.gltf` invocation with `export_yup=True` and Draco compression),
- and the walkthrough video pipeline driven by
  `Website Project/claude_design/inverted_pendulum/handoff/animate.py`.

Sibling references that live alongside the `.blend` but outside the
website tree:

- `../Textures/` — PolyHaven `metal_plate` / `metal_plate_02` source textures used by the composed GLB.
- `../iter*.png`, `../kit-*.png`, `../run-*.png`, `../studio-*.png`, `../site-*.png`, `../swing-t*.png`, `../post-perturb.png`, `../stuck1.png`, `../initial-load.png` — iteration screenshots taken during the build.
- `../heintzmann-*.png` — typography references (mirrored into `claude_design/inverted_pendulum/uploads/`).
- `../.playwright-mcp/` — Playwright MCP cache from interactive browser sessions against the site.
- `../.firecrawl/` — Firecrawl cache.
- `../.claude/` — Claude Code session state.
