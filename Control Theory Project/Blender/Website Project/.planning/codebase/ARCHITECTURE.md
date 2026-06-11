# ARCHITECTURE

Single-page interactive 3D inverted pendulum lab. Real Blender geometry
exported to one Draco-compressed GLB, loaded by Three.js in the browser,
and driven by a live RK4 simulator that implements the equations from the
CT_Project paper (Patel, Kurle, Golait, Kanwat 2022). No build step; no
framework; everything runs from three static files + one binary asset.

## Layers

The runtime is a thin vertical stack — every layer is in one of two files
(`site/app.js`, `site/index.html`) and they are wired together inside the
single `frame()` rAF loop.

| Layer | File(s) | What it owns |
|---|---|---|
| Static shell | `claude_design/inverted_pendulum/site/index.html` | DOM skeleton, `<canvas id="stage">`, importmap, modulepreloads, GLB `<link rel=preload>`, loader, hero overlay, mode pills, KIT callout, STUDIO sub-pills + panels (diagram/plots/math), tweaks panel, share-frame button, HUD readouts. |
| Asset load | `claude_design/inverted_pendulum/site/app.js` (lines 254–412) | `GLTFLoader` + `DRACOLoader` (decoder from gstatic CDN), per-minute cache-bust on the GLB URL, progress reporting into the loader UI, mesh traversal that clones materials, registers parts in a `Map`, and identifies the bob meshes + tip probe. |
| Physics | `app.js` (15–96, 414–451) | `PHYS` constants table, `wrap()` angle normalisation, `rhs()` (3-state ODE), `rk4()` step, `physicsStep()` substepper, `sim` state container, NaN guard. |
| Controller | `app.js` (40–67) | `controlVoltage()` — PD cascade vs. energy-pump destabiliser switch on `|θ|` and `T < T_t`, voltage saturation at ±`Vmax`. |
| Scene + visuals | `app.js` (98–251, 757–892) | Renderer (`WebGLRenderer`, ACES tonemap, PCF soft shadows), camera + `OrbitControls`, lights (key directional + cool fill + acid spot rim + hemisphere), shadow-only ground, gizmo overlay scene, rod-tip trail buffer geometry, bob-emission pulse. |
| UI mode router | `app.js` (453–541) | `uiState` (mode + sub + KIT cycle), `setMode()` / `setSub()`, keyboard handler (`1/2/3 D/P/M R Space S Esc ? T`), camera tween targets per mode, KIT auto-cycle. |
| Plots + KPIs | `app.js` (609–755) | 2D canvas plots for θ(t), τ(t), i(t), open-loop poles, phase portrait, and KPI tracker (`|θ|max`, `|τ|max`, settle timer, region). |
| Side panels | `app.js` (930–1097) | Share-frame compositor (1920×1080 PNG, optional clipboard via Shift), tweaks panel sliders (`Kp`, `Kd`, `Vmax`→derived `θ0`/`Tt`), accent swatches, window resize. |

The architecture intentionally has zero module boundary inside `app.js` —
the loop is a single function that calls into physics, controller, view
update, plots, and gizmo render in a fixed order each frame.

## Boot sequence (browser)

Strict ordering matters because the page uses bare-specifier ES module
imports against an importmap, while preloading the same files for warm
cache.

1. `index.html` parses head:
   - Fonts preconnect + Google Fonts stylesheet for Geist / Geist Mono / Instrument Serif.
   - `styles.css` (Claude design system tokens, light theme).
   - **Importmap declared BEFORE any `<link rel=modulepreload>`** so the
     bare specifiers `three` and `three/addons/` resolve. Reversing this
     order breaks Chrome (see `site/CLAUDE.md`).
   - `modulepreload` warms `three.module.js`, `GLTFLoader`, `DRACOLoader`,
     `OrbitControls`, `RoomEnvironment`.
   - `<link rel=preload as=fetch>` warms `assets/pendulum.glb` so the
     later `GLTFLoader.load()` is served from RAM cache.
2. Body renders the loader (`#loader`) with status bar. The 3D `<canvas>`
   and the hero (`#hero.hidden`) sit underneath, invisible.
3. `<script type=module src="app.js?v=debug2">` executes top-to-bottom:
   - Builds renderer, scene, camera, controls (disabled), lights, IBL
     environment from `RoomEnvironment`, gizmo overlay scene, trail
     geometry, shadow ground.
   - Constructs `DRACOLoader` and calls `draco.preload()` to warm the WASM
     decoder before the GLB request lands.
   - Issues `gltfLoader.load(GLB_URL, onLoad, onProgress, onError)` against
     `assets/pendulum.glb?v=<minute>`.
   - `onProgress` updates `#loader-status` and the fill bar between 8% and
     78%.
4. `onLoad` callback:
   - Walks the scene with `traverse()`, clones every `MeshStandardMaterial`
     (so per-instance highlight tweaks don't bleed), caches each material's
     base color + emissive into `userData`, populates `partRegistry`
     (name → mesh) and collects the bob meshes.
   - Tags the highlight bob meshes (`mass_big_bolt|mass_small_bolt|mass_screw`)
     with acid-green emission at intensity 0.
   - Picks the pivot world position from the encoder coupler mesh's bbox
     center, falling back to the hardcoded `(-0.20, 1.48, 0.07)`.
   - Builds the `_pendulum_pivot` Group at that pivot, reparents the bob
     meshes via `attach()` (preserves world transform), stores
     `rodLength`, `restDir`, `baseQuat`, `swingAxis` in `userData`.
   - Hides the loader, calls `startLoop()`.
5. `startLoop()` → `setMode('kit')` → first rAF frame → `showHero()` fades
   in the hero overlay over the running scene.
6. User clicks `[ ENTER LAB ]` (or presses 1/2/3/Enter/Space) →
   `dismissHero()` adds `.gone`, switches to RUN, clears trail.

## Physics layer (RK4 + paper equations)

State vector is `(θ, ω, i)` — angle from upright, angular velocity, motor
coil current. Continuous-time plant from the paper:

```
J θ̈ + b θ̇  =  K·i + m·g·l·sin θ            (eq 1)
L i̇  + i·R  =  V − K·θ̇                     (eq 2)
```

Implementation (`app.js`):

- `PHYS` (15–33) — identified motor + rig parameters: `J=0.2004`,
  `b=2.9630`, `K=1.1112`, `R=2.3634`, `L=0.9794`, plus pendulum geometry
  `m=0.50`, `l=0.30`, `g=9.81`, gains `Kp=196`, `Kd=28`, `Kp,i=446`,
  voltage cap `Vmax=6.0`.
- Derived (34–36): `θ0 = arcsin(K·Vmax / (m·g·l·R))` clamped to ±1,
  and the energy-switch threshold `T_t = -mgl·(1 − cos(θ0/2))`.
- `wrap(a)` (38) — normalises any angle into `(-π, π]`.
- `rhs(state, V, p)` (69–77) — closed-form ODE returning
  `{dtheta, domega, di}`.
- `rk4(state, dt, p, mode)` (78–96) — classic 4-stage RK4. Holds `V`
  constant across the four sub-evaluations (zero-order hold within a
  millisecond step). Also computes `tau = K·i` for HUD readout.
- `physicsStep(realDt)` (428–451) — substepping driver. Clamps `realDt`
  to 50 ms (so a long page idle doesn't explode the integrator), splits
  it into `n = max(1, round(cap / 0.001))` RK4 steps of `dt = 1 ms`, and
  pushes one history sample per visual frame. History is trimmed to a
  6-second sliding window for plotting.
- NaN guard inside the substep loop: if any of `θ, ω, i` returns non-finite,
  the state is reset to `{theta: π, omega: 0.001, i: 0}` and `sim.t`
  continues to advance, so the user sees the pendulum recover instead of
  freezing.

`sim` (414–424) holds `state`, `mode` (`'swing' | 'off'`), `t`, last
controller outputs, and `history[]`. It is exposed on `window.__sim` /
`window.__PHYS` for console poking.

## Controller cascade (destabilizer ↔ PD + current loop)

`controlVoltage(state, p, mode)` is the single dispatch:

- `mode === 'off'` → `V = 0`, `i_ref = 0`, `region = 'off'`.
- Compute mechanical energy `T = -m·g·l·(1 − cos θ) + ½·J·ω²` (zero
  reference at upright).
- **Stabiliser region** (`|θ| < θ0`):
  1. Desired closed-loop acceleration `θ̈_c = −Kp·θ − Kd·ω`.
  2. Desired current via inverse plant + feedforward
     `i_d = (J/K)·θ̈_c + (b/K)·ω + (mgl·sin θ)/K` (paper eq 15).
  3. Inner P current loop on the error `i_d − i`:
     `i̇_c = Kp,i·(i_d − i)` (eq 17).
  4. Voltage command with back-EMF feedforward
     `V = L·i̇_c + i·R + K·ω` (eq 18).
  5. `region = 'pd'`.
- **Destabiliser region** (`|θ| ≥ θ0` and `mode === 'swing'`):
  - Bang-bang energy pump: if `T < T_t`, fire `V = sgn(ω)·Vmax`; else
    `V = 0` (paper eq 14, with energy switch from eq 10/Tt).
  - `region = 'swingup'`.
- Otherwise `region = 'idle'`, `V = 0`.
- Final saturation: `V = clamp(V, -Vmax, +Vmax)`.

The handoff between regions is implicit (geometry: `|θ| < θ0`); there's no
hysteresis. The energy-switch (`T < T_t`) keeps the destabiliser from
overshooting at the top — once the pendulum has enough mechanical energy
to be caught, the pump cuts out and the unforced plant carries it into
the PD basin.

Frame loop side-effect: when `region` transitions into `'pd'` from any
other value, `pulseBob()` is fired (line 775), which sets `pulseT = 1.0`
and is decayed at `4/s` to flash the bob's emission and the acid spot
rim. This is the "PD catch" celebration visible in the prototype.

## UI mode router (KIT / RUN / STUDIO)

State lives in `uiState = { mode, sub, kitIdx, kitTimer }` (453–459).
`setMode(m)` is the single mutator:

- Toggles `.active` class on the three mode pills (`#pills .pill`).
- Rewrites the bottom-left mode badge (`#b-num`, `#b-label`) and the
  bottom-right help hint (`#b-hint`) per mode.
- `controls.enabled = (m !== 'kit')` — orbit/drag is disabled in KIT.
- Clears any KIT highlight (restores material baseColor + emissive), so
  switching modes never leaks a tinted material.
- Shows `#sub-pills` only when `m === 'studio'`, and toggles `.hidden` +
  `.visible` on each of the three studio panels (`#panel-diagram`,
  `#panel-plots`, `#panel-math`) according to `uiState.sub`.
- Kicks off a `camAnim` tween: each mode has a hardcoded camera pose
  `{ pos, look, fov }` (504–509). The tween runs over 0.85 s with an
  ease-out cubic, lerping position + look-target + FOV.

Mode-specific behaviour inside the frame loop:

- **KIT** — `uiState.kitTimer` accumulates `realDt`; every 3.6 s the
  highlight advances to the next entry in `partLabels[]` (7 entries:
  Arduino, motor, encoder, breadboard, rod+bob, stands, PSU). The
  callout (`#kit-callout`) shows `[NN] LABEL · SUB`. `applyKitHighlight()`
  walks `partRegistry`, sets the matching meshes' emission to acid
  green at a per-material factor (metals 0.10–0.14, stands 0.18,
  plastics/PCB 0.24) and dims everything else by multiplying its base
  color by 0.22 (or 0.55 for the bob).
- **RUN** — controls enabled. `Space` perturbs `ω` by `±4 rad/s` and
  fires a bob pulse. Clicking the canvas adds `±3 rad/s` based on which
  half-screen was clicked. `R` resets state. `S` toggles `sim.mode`
  between `'swing'` and `'off'`.
- **STUDIO** — sub-router via `setSub('diagram'|'plots'|'math')`. When
  `sub === 'plots'`, the frame loop draws θ/τ/i/poles/phase canvases
  and runs `updateKPIs()`. Diagram and Math are static HTML.

Other keyboard / UI:

- `?` or `/` toggles `document.body.classList` `advanced`, revealing the
  tweaks + share FABs.
- `T` toggles the tweaks panel directly.
- `Esc` returns to KIT.

## Coordinate frames (Blender Z-up vs Three.js Y-up)

The GLB is exported from Blender with `export_yup=True` (see the snippet
in `site/CLAUDE.md`), so Three.js loads it directly without further axis
swizzling. The mapping is documented in `site/CLAUDE.md` and `BLENDER_SPEC.md`:

| Blender axis | Three.js axis | Meaning in this scene |
|---|---|---|
| `+X` | `+X` | depth / side-to-side |
| `+Y` | `-Z` | along the encoder/motor shaft (swing axis) |
| `+Z` | `+Y` | world up |

In the authored Blender pose the bob is offset along Blender `+X`
(sideways from the shaft), so after the Y-up swap it sits at Three
`+X`. The runtime rotates that into world `+Y` so that `θ = 0`
visually means "upright" (paper convention).

## Where Blender world coords are pinned in code (hardcoded pivot, baseQuat, swing axis)

Inside the GLB-load callback (`app.js` 329–391), the pivot rig is built
from a small set of hardcoded constants. These are the values that tie
the JS controller frame to the Blender authoring frame — if the Blender
scene shifts, these need to move with it.

- **Pivot world position**: `let pivotPos = new THREE.Vector3(-0.20, 1.48, 0.07);`
  (332). Primary source is the bbox center of the mesh
  `'ct encoder coupler v4 (Meshed)'` looked up in `partRegistry`; the
  hardcoded literal is the documented fallback when that mesh is
  missing. Same triple appears in `site/CLAUDE.md` as the canonical
  pivot.
- **Rod length**: `let rodLength = 1.36;` (342). Overridden by the
  largest extent of the `swinging_support_rod*` mesh bbox at load.
- **`restDir`**: `new THREE.Vector3(0, -1, 0)` stored on
  `pendulumGroup.userData` (375) — the rest direction the bob points
  when θ = π (hanging down).
- **`baseQuat`**: built via
  `new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0), uprightDir)`
  where `uprightDir = (0, 1, 0)` (383–386). This rotates the GLB's
  authored bob direction `+X` onto world `+Y`, so the identity-θ pose
  is upright.
- **`swingAxis`**: `new THREE.Vector3(0, 0, -1)` (391) — Blender `+Y`
  after the Y-up swap. The rotation each frame is
  `swingQ = setFromAxisAngle(swingAxis, wrap(θ))` and the final pose
  is `swingQ × baseQuat` (line 786). Composing in that order means
  `θ = 0` lands the bob at world `+Y` and `θ = π` lands it at `-Y`.

The pendulum bob meshes are reparented into `pendulumGroup` via
`pendulumGroup.attach(m)` so their world transform is preserved at the
moment of reparenting — only subsequent θ updates rotate them.

The tip probe used to draw the rod-tip trail is `mass_big_bolt_U` (any
mesh whose name starts with that — 324). Its world position is read via
`tipProbe.getWorldPosition(tipScratch)` after each rotation update, and
fed into `pushTrail()` (204–241).

## Failure modes covered (NaN guard) + uncovered

**Covered:**

- **Integrator blow-up after long page idle** — `physicsStep` clamps
  `realDt` to 50 ms and substeps at 1 ms.
- **NaN/Inf in state** — the post-RK4 check inside `physicsStep` resets
  to `{π, 0.001, 0}` and keeps `sim.t` advancing.
- **GLB load failure** — `gltfLoader.load()` `onError` writes
  `ERROR · CHECK CONSOLE` to the loader status. The loop never starts,
  so no NaN-from-undefined-pivot cascade is possible.
- **Trail teleport** — `pushTrail()` detects any frame-over-frame jump
  > 20 cm and clears the trail buffer, preventing a chord across the
  world after a perturb or reset.
- **Mode focus stealing Space** — a `keydown` capture handler blurs the
  active element on Space so the perturb keybind doesn't also activate
  a focused pill.
- **Cached GLB during dev** — URL is cache-busted to a per-minute
  version (`?v=Math.floor(Date.now()/60000)`), so re-exports appear
  within ≤ 60 seconds without a hard reload.
- **Hero double-dismiss** — `heroDone` latch.
- **Encoder-coupler missing** — pivot falls back to the hardcoded
  `(-0.20, 1.48, 0.07)`.

**Uncovered (known gaps):**

- **`Vmax` slider at extreme low values** — `θ0 = arcsin(K·Vmax /
  (mglR))`. If a user drives `Vmax` low enough that
  `K·Vmax/(mglR) > 1`, the `Math.min(1, ...)` clamp produces
  `θ0 = π/2`, which means "always in PD region" — the bang-bang energy
  pump never fires and the pendulum will never swing up from hanging.
  No UI warning.
- **`L = 0` or `J = 0`** — not exposed in the tweaks panel; if set via
  console (`window.__PHYS.L = 0`), `rhs()` divides by zero. No guard.
- **`tipProbe` missing** — if no mesh matches `/^mass_big_bolt_U/`,
  `tipProbe` stays `null` and the trail simply doesn't draw. No log.
- **WebGL context loss** — no `webglcontextlost` handler.
- **`OrbitControls` damping when `controls.enabled = false`** — calling
  `controls.update()` every frame is fine, but no logic prevents a
  user from leaving KIT mid-drag with the mouse held.
- **Page resize** — handled for renderer + camera, but the gizmo
  scissor rect is fixed at `gx = innerWidth - 144`, `gy = 80`; on very
  small viewports the gizmo can overlap the bottom hint.

## Cross-cutting concerns

- **No build step.** Everything is hand-authored static. Importmap +
  modulepreload + CDN-hosted Three.js (`unpkg.com/three@0.160.0`) +
  CDN-hosted Draco decoder (`gstatic.com/draco/versioned/decoders/1.5.6/`).
  Dev server is `python3 -m http.server 8765` per `site/CLAUDE.md`.
- **Color management.** Renderer sets `outputColorSpace = SRGBColorSpace`
  and `toneMapping = ACESFilmicToneMapping` with `exposure = 0.95`.
  Background is bone `#F5F3EE` (light theme); IBL environment is
  `RoomEnvironment` with `0.04` blur. Materials get
  `envMapIntensity = 0.85`. The Blender side uses AgX color management
  per `BLENDER_SPEC.md` — these two pipelines are calibrated to look the
  same; if you re-render the prototype dark, switch the renderer
  clearColor + scene.background + ground material at the same time.
- **Share-frame capture.** Renderer is constructed with
  `preserveDrawingBuffer: true` so the canvas is sampleable. The
  share-frame button (`#share-frame`) bumps the renderer to 1920×1080,
  re-renders, composites design chrome (bracket corners + LAB title +
  equation + live readout) on a 2D canvas, then either copies to
  clipboard (Shift+click, via `ClipboardItem`) or downloads as
  `pendulum-{timestamp}.png`.
- **Plot windows.** `sim.history` is trimmed to the last 6 seconds.
  All time-domain plots use that window. The phase portrait (θ vs ω)
  uses the same buffer but draws in state space; segments are skipped
  if `|Δθ| > π` so wrap discontinuities don't draw chords.
- **Open-loop poles.** Hardcoded `[-14.27, -2.94, +0.01]` from the
  paper in `drawPoleZero()`; the `+0.01` pole is in the RHP and gets
  acid-green coloring + a red right-half-plane shading. They are NOT
  recomputed from `PHYS` — tweaking gains does not move them.
- **KPIs.** `absThetaMax`, `absTauMax`, and a settle timer that starts
  when `region === 'pd'` and `|θ| < 0.05`. Region label is shown live.
- **Material tagging at load.** Materials are cloned per-mesh (so the
  per-part KIT dim doesn't share state). `baseColor` and `baseEmissive`
  are stashed in `material.userData` and restored on
  `clearKitHighlight()`.
- **Accent swatch.** Changing the accent swatch in the tweaks panel
  sets the CSS variable `--accent`, repaints the bob emission, and
  changes the rim spotlight color — all from one click handler.
- **`window.__sim`, `window.__PHYS`.** Live debug handles, intentionally
  global.
- **Blender → site asset pipeline.** `site/CLAUDE.md` documents the
  Blender export snippet (`bpy.ops.export_scene.gltf` with
  `export_yup=True`, JPEG q80, Draco compression level 6, position
  quantization 14, normal 10, texcoord 12). The composed GLB sits at
  `site/assets/pendulum.glb` and is 10.6 MB.
- **Walkthrough video pipeline (parallel track).** `handoff/` is a
  separate deliverable — the same Blender scene driven by `animate.py`
  + `theta_history.json` to render a 30 fps PNG sequence, composited
  to MP4 by `compose.sh`. It shares the visual language (palette,
  fonts, bracket chrome) with the interactive site but lives entirely
  outside `site/`.
