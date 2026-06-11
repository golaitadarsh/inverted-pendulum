# STACK

## Runtime

- **Primary runtime: modern desktop web browser.** The interactive lab at
  `claude_design/inverted_pendulum/site/index.html` is a single-page,
  fully client-side experience — no Node runtime, no SSR, no build step.
  All physics, rendering, and UI run in the browser tab.
- **Secondary runtime: Blender's embedded Python (`bpy`).** Used only for
  authoring/exporting geometry and the offline animation utility
  `claude_design/inverted_pendulum/animate.py`. Not present at web
  runtime — `theta_history.json` (its only output of interest) is also
  not loaded by the live site.
- No server-side runtime. Static file serving only (`python3 -m http.server`).

## Languages

- **JavaScript (ES2022 modules)** — the entire interactive site:
  `claude_design/inverted_pendulum/site/app.js` (single ~1k-line module,
  loaded via `<script type="module" src="app.js?v=debug2">` in
  `claude_design/inverted_pendulum/site/index.html`).
- **HTML5** — `claude_design/inverted_pendulum/site/index.html` shell,
  hero overlay, chrome, panels, importmap, modulepreload, GLB preload.
- **CSS3** — `claude_design/inverted_pendulum/site/styles.css` (Claude
  design-system tokens, light theme, responsive breakpoints).
- **Python 3** — `claude_design/inverted_pendulum/animate.py` (Blender
  `bpy` script for offline rig animation + `theta_history.json` capture);
  also used as the static dev server (`python3 -m http.server 8765`).
- **JSON** — `claude_design/inverted_pendulum/site/assets/scene_meta.json`
  (world-bounds metadata, currently unused at runtime per
  `claude_design/inverted_pendulum/site/CLAUDE.md`) and
  `claude_design/inverted_pendulum/handoff/theta_history.json`.
- **GLB / glTF 2.0 (binary)** — `claude_design/inverted_pendulum/site/assets/pendulum.glb`
  and the per-part GLB assets in `assets/` (e.g. `assets/arduino_uno.glb`,
  `assets/motor.glb`, `assets/encoder.glb`, `assets/cutting_mat.glb`,
  `assets/swinging_support_rod.glb`, etc.).

## Frameworks & libraries

- **Three.js `0.160.0`** — core WebGL renderer. Imported as a bare
  specifier `three` resolved by the importmap in
  `claude_design/inverted_pendulum/site/index.html` (lines 28–35) to
  `https://unpkg.com/three@0.160.0/build/three.module.js`.
- **Three.js addons (also `0.160.0` via importmap prefix
  `three/addons/`)** imported by
  `claude_design/inverted_pendulum/site/app.js` (lines 1–5):
  - `GLTFLoader` — `three/addons/loaders/GLTFLoader.js`
  - `DRACOLoader` — `three/addons/loaders/DRACOLoader.js`
  - `OrbitControls` — `three/addons/controls/OrbitControls.js`
  - `RoomEnvironment` — `three/addons/environments/RoomEnvironment.js`
    (drives `PMREMGenerator` for IBL)
- **Draco decoder `1.5.6`** — WASM mesh-decompression runtime loaded
  by `DRACOLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')`
  in `claude_design/inverted_pendulum/site/app.js` (line 255). `draco.preload()`
  is called immediately after to warm the WASM before the GLB fetch lands.
- **Blender `bpy`** — author/export pipeline only (see
  `claude_design/inverted_pendulum/handoff/BLENDER_SPEC.md` and
  `claude_design/inverted_pendulum/animate.py`).
- No frontend framework (no React/Vue/Svelte), no bundler (no
  Vite/Webpack/Rollup), no CSS framework (no Tailwind), no package.json.

## Build / dev / serve

- **No build step.** ES modules are loaded directly by the browser via
  `<script type="module">` and the importmap; no transpilation, no
  minification.
- **Dev/serve:** `python3 -m http.server 8765` from
  `claude_design/inverted_pendulum/site/`, then open
  `http://localhost:8765/index.html` (documented in
  `claude_design/inverted_pendulum/site/CLAUDE.md` and confirmed
  by the absence of any package manager / build manifest).
- **Cache-busting:**
  - Script tag uses a static query (`app.js?v=debug2`) in
    `claude_design/inverted_pendulum/site/index.html` (line 298).
  - GLB URL is cache-busted per-minute by
    `const V = Math.floor(Date.now()/60000); const GLB_URL = `assets/pendulum.glb?v=${V}`;`
    in `claude_design/inverted_pendulum/site/app.js` (lines 261–262).
- **Preload hints** in `claude_design/inverted_pendulum/site/index.html`:
  `<link rel="modulepreload">` for Three.js core + each addon module
  (lines 37–41), `<link rel="preload" as="fetch" crossorigin>` for
  `assets/pendulum.glb` (line 43), and
  `<link rel="preconnect">` / `<link rel="dns-prefetch">` for
  `https://www.gstatic.com` (lines 25–26) plus Google Fonts (lines 20–21).
- **Asset (re)build:** Blender `bpy.ops.export_scene.gltf(...)` with
  Draco mesh compression. Exact invocation documented in
  `claude_design/inverted_pendulum/site/CLAUDE.md` ("Re-exporting from
  Blender") and in `claude_design/inverted_pendulum/handoff/BLENDER_SPEC.md`.
  A helper shell script exists at
  `claude_design/inverted_pendulum/compose.sh`.

## Numerical constants (paper-derived)

All identified physical parameters live in the `PHYS` object in
`claude_design/inverted_pendulum/site/app.js` (lines 15–33), sourced from
the CT_Project 2022 paper (`CT_Project.pdf`, Patel/Kurle/Golait/Kanwat):

- **Identified plant / motor (paper §III, Table III):**
  - `J = 0.2004` kg·m² — pendulum + rotor inertia
  - `b = 2.9630` N·m·s — viscous friction
  - `K = 1.1112` V·s — back-EMF / torque constant
  - `R = 2.3634` Ω — armature resistance
  - `L = 0.9794` H — armature inductance
- **Pendulum geometry (chosen to match experimental `mgl ≈ 1.47 N·m`,
  not provided explicitly in paper):**
  - `m = 0.50` kg, `l = 0.30` m, `g = 9.81` m/s²
- **Controller gains (paper §V, eqs 23/24/25):**
  - `Kp = 196` — PD position proportional
  - `Kd = 28` — PD position derivative
  - `Kp_i = 446` — inner current-loop proportional
- **Voltage cap (paper §IV):**
  - `Vmax = 6.0` V — PWM saturation
- **Derived at module init in `app.js` (lines 35–36):**
  - `theta0 = arcsin(min(1, K·Vmax / (m·g·l·R)))` — limiting/handoff
    angle between swing-up and PD-balance regions (paper eq 10)
  - `Tt = -m·g·l·(1 - cos(theta0/2))` — energy threshold for the
    bang-bang swing-up switch
- **Integrator:** 3-state RK4 in `θ, ω, i` with fixed `dt = 1 ms`
  substepped per real `Δt` (function `rk4(...)` in
  `claude_design/inverted_pendulum/site/app.js` lines 78–96).
- **Hard-coded design targets in `index.html`:** `target settle = 0.29 s`
  (KPI label), open-loop poles `−14.27, −2.94, +0.01`, design
  `4/(ζω_n) = 0.29 s` with `ζ = 1` (Studio Math panel, lines 242–244).

## Notable browser APIs used

(All consumed by `claude_design/inverted_pendulum/site/app.js` unless noted.)

- **WebGL2** via `new THREE.WebGLRenderer({ canvas, antialias: true,
  powerPreference: 'high-performance', preserveDrawingBuffer: true })`
  on `<canvas id="stage">` (`app.js` line 100). `preserveDrawingBuffer`
  is what enables the share-frame PNG capture pipeline.
- **`requestAnimationFrame`** — main render/sim loop (`app.js` lines 884,
  891) plus a couple of post-layout panel toggles (lines 492, 517, 903).
- **Canvas 2D (`HTMLCanvasElement.getContext('2d')`)** — five live plot
  canvases in the Studio panel (θ, τ, poles, current, phase portrait):
  `ctxT`, `ctxU`, `ctxP`, `ctxI`, `ctxPh` (`app.js` lines 615–619) and
  the offscreen 1920×1080 composite for the share-frame export
  (`app.js` lines 952–954).
- **`<script type="importmap">`** — bare-specifier resolution for
  `three` and `three/addons/` (`index.html` lines 28–35). Per the
  comment in `index.html` (line 27) and in `site/CLAUDE.md`, the
  importmap MUST precede the `<link rel="modulepreload">` tags so
  Chrome resolves the bare specifiers correctly.
- **`navigator.clipboard.write` + `ClipboardItem`** — Shift+click on
  the `[ ⤓ ] FRAME` button copies the rendered PNG to the system
  clipboard (`app.js` lines 1014–1016), with a download fallback via
  `canvas.toBlob` (`app.js` line 1012ff).
- **`HTMLCanvasElement.toBlob` + dynamic `<a download>` link** —
  plain-click path of the share-frame export.
- **SVG data-URI favicon** — inline acid-green dot on bone background
  (`index.html` line 19).
- **`prefers-reduced-motion` media query — NOT yet wired.** A grep across
  `claude_design/inverted_pendulum/site/app.js` and `styles.css` finds
  no match; the animation loop, hero reveal, and KIT auto-cycle run
  unconditionally.

## Versions

- **Three.js: `0.160.0`** — pinned in importmap and in every
  `<link rel="modulepreload">` (`index.html` lines 31–32, 37–41).
- **Draco decoder: `1.5.6`** — pinned in
  `DRACOLoader.setDecoderPath(...)` (`app.js` line 255).
- **glTF: 2.0 / GLB** — produced by Blender's `export_scene.gltf` with
  `export_format='GLB'`, `export_yup=True`, Draco mesh compression
  level 6 (position q=14, normal q=10, texcoord q=12), JPEG textures
  at quality 80 (per the "Re-exporting from Blender" block in
  `claude_design/inverted_pendulum/site/CLAUDE.md` and
  `claude_design/inverted_pendulum/handoff/BLENDER_SPEC.md`).
- **Fonts: Google Fonts CSS2 endpoint** —
  `Geist` (weights 300/400/500/700/900), `Geist Mono` (weights
  400/500/600), `Instrument Serif` (italic 0/1) (`index.html` line 22).
- **HTML living standard / CSS3** — `<!doctype html>`, `<meta
  charset="utf-8">`, `<meta name="viewport" content="width=device-width,
  initial-scale=1">` (`index.html` lines 1–5).
- **Site version stamp:** `LAB / 04 · 2026 · v0.1` (chrome strings in
  `index.html` lines 50, 70, 102).
- **No `package.json`, no lockfile, no Node engine pin** — all external
  versions are pinned only by URL in `index.html` / `app.js`.
