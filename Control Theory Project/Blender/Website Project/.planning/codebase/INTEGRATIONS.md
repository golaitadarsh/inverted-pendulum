# INTEGRATIONS

## External services / CDNs

The live site is fully client-side static, but it pulls four classes of
asset from third-party hosts at runtime. All are referenced by hard-coded
absolute URLs in
`claude_design/inverted_pendulum/site/index.html` and
`claude_design/inverted_pendulum/site/app.js`.

- **unpkg — Three.js modules (`https://unpkg.com/three@0.160.0/...`).**
  Resolved via the importmap in
  `claude_design/inverted_pendulum/site/index.html` (lines 28–35):
  - `three` → `https://unpkg.com/three@0.160.0/build/three.module.js`
  - `three/addons/` → `https://unpkg.com/three@0.160.0/examples/jsm/`

  Concrete modules pulled by `app.js`:
  - `https://unpkg.com/three@0.160.0/build/three.module.js`
  - `https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js`
  - `https://unpkg.com/three@0.160.0/examples/jsm/loaders/DRACOLoader.js`
  - `https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js`
  - `https://unpkg.com/three@0.160.0/examples/jsm/environments/RoomEnvironment.js`

  Each is also warmed via `<link rel="modulepreload">` tags placed
  *after* the importmap (`index.html` lines 37–41), in line with the
  Chrome resolution-order note in the file's own comment (line 27) and
  in `claude_design/inverted_pendulum/site/CLAUDE.md`.

- **Google's gstatic CDN — Draco WASM decoder
  (`https://www.gstatic.com/draco/versioned/decoders/1.5.6/`).** Set in
  `claude_design/inverted_pendulum/site/app.js` (line 255):
  `draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')`,
  followed immediately by `draco.preload()` to warm the WASM before
  the GLB fetch resolves. The page also issues
  `<link rel="preconnect" href="https://www.gstatic.com" crossorigin>`
  and `<link rel="dns-prefetch" href="https://www.gstatic.com">` in
  `index.html` (lines 25–26).

- **Google Fonts — `https://fonts.googleapis.com` (CSS) and
  `https://fonts.gstatic.com` (font binaries).** Loaded by a single
  stylesheet `<link>` in `claude_design/inverted_pendulum/site/index.html`
  (line 22) with `display=swap`. Preconnect hints on lines 20–21.
  See "Third-party fonts / icons" below for face details.

- **Same-origin asset preload — `assets/pendulum.glb`.** Not third-party,
  but a runtime-critical fetch: `<link rel="preload" href="assets/pendulum.glb"
  as="fetch" crossorigin />` in `index.html` (line 43). The matching
  `GLTFLoader.load` in `app.js` reuses this RAM-cached response.

No analytics, no telemetry, no auth provider, no backend API. The
`navigator.clipboard.write` / `ClipboardItem` path in the share-frame
button (`app.js` lines 1014–1016) is a browser-native API, not a
third-party service.

## Asset pipeline (Blender → web)

1. **Blender authoring** in `../inverted_pendulum.blend` (the parent
   `Blender/` directory, one level above `Website Project/`). The
   master scene composes every part listed below into a single rig
   with named empties — most importantly the `mass` empty that the
   web runtime drives with θ (see
   `claude_design/inverted_pendulum/site/CLAUDE.md` → "Axis
   conventions" and "Mesh name patterns").

2. **Per-part GLB exports** live at the project root in
   `Website Project/assets/`:
   `12V_10A.glb`, `arduino_uno.glb`, `base_support_stand.glb`,
   `breadboard.glb`, `ct encoder coupler.glb`, `ct motor coupler.glb`,
   `cutting_mat.glb`, `encoder.glb`, `encoder_support_stand.glb`,
   `mass_big_bolt_L.glb`, `mass_big_bolt_U.glb`, `mass_screw.glb`,
   `mass_small_bolt.glb`, `motor.glb`, `motor_support_stand.glb`,
   `swinging_support_rod.glb`.

3. **Composed bundle** at
   `claude_design/inverted_pendulum/site/assets/pendulum.glb`
   (~10.6 MB Draco-compressed; size noted in
   `claude_design/inverted_pendulum/site/CLAUDE.md`). This is the
   single GLB the runtime actually loads. Produced manually from
   Blender via `bpy.ops.export_scene.gltf(...)` with the flags
   documented in `claude_design/inverted_pendulum/site/CLAUDE.md`:

   - `export_format='GLB'`, `use_selection=True`, `export_yup=True`
   - `export_image_format='JPEG'`, `export_jpeg_quality=80`
   - `export_draco_mesh_compression_enable=True`,
     `export_draco_mesh_compression_level=6`
   - `export_draco_position_quantization=14`,
     `export_draco_normal_quantization=10`,
     `export_draco_texcoord_quantization=12`

   Before export, the `mass` empty's rotation is reset to baseline
   (`bpy.data.objects['mass'].rotation_euler = (-π/2, 0, 0)`) so the
   web runtime can drive θ from a clean zero. Authoring details +
   selection rules also live in
   `claude_design/inverted_pendulum/handoff/BLENDER_SPEC.md`.

4. **Textures.** PolyHaven `metal_plate` + `metal_plate_02` are baked
   into the GLB at JPEG q80, 1024² (per
   `claude_design/inverted_pendulum/site/CLAUDE.md`). User-provided
   `cutting_mat.glb` is imported into the master scene and scaled to
   ~5.45 m before composition.

5. **Runtime load.** `GLTFLoader` + `DRACOLoader` in
   `claude_design/inverted_pendulum/site/app.js` (lines 253–262) fetch
   `assets/pendulum.glb?v={Math.floor(Date.now()/60000)}` — per-minute
   cache-bust so Blender re-exports surface within ~60 s on dev.

6. **Axis remap.** Blender Z-up → GLB Y-up (Blender +Y is the swing
   axis → three -Z); pivot is recorded in
   `claude_design/inverted_pendulum/site/CLAUDE.md` as world
   `(-0.20, 1.48, 0.07)` (encoder coupler center). A `baseQuat` in
   `app.js` rotates the GLB-authored bob direction `+X` → upright
   `+Y` so θ=0 reads as "upright" per the paper.

7. **Offline animation utility — `claude_design/inverted_pendulum/animate.py`.**
   Drives the same `mass` empty in Blender to dump
   `claude_design/inverted_pendulum/handoff/theta_history.json`. Not
   consumed by the web runtime (the live site re-derives θ via its
   own in-browser RK4 integrator); it exists for renders/validation.

8. **Scene metadata sidecar —
   `claude_design/inverted_pendulum/site/assets/scene_meta.json`.**
   Holds world-bounds metadata. Currently unused at runtime per
   `claude_design/inverted_pendulum/site/CLAUDE.md`.

## Source documents

- **`CT_Project.pdf`** (project root) — Patel · Kurle · Golait · Kanwat
  *2022*. Authoritative source for all physics constants and control
  laws implemented in `claude_design/inverted_pendulum/site/app.js`:
  - Plant (eq 1): `J θ̈ + b θ̇ = K·i + m·g·l·sin(θ)`
  - Motor (eq 2): `L·di/dt + i·R = V − K·θ̇`
  - Destabilizer (eq 14): `V = V_max · sgn(θ̇)` for `T < T_t`; else `0`
  - PD position (eq 15) + P current (eq 17) + feedforward (eq 18)
  - Identified parameters (Table III): `J, b, K, R, L`
  - Controller gains (§V eqs 23–25): `Kp, Kd, Kp_i`
  - Voltage cap (§IV): `Vmax = 6 V`; handoff angle `θ₀` (eq 10)

  These are echoed in the Studio Math panel of
  `claude_design/inverted_pendulum/site/index.html` (lines 211–246)
  and in the `PHYS` block of
  `claude_design/inverted_pendulum/site/app.js` (lines 15–36).

- **`claude_design/inverted_pendulum/handoff/BLENDER_SPEC.md`** —
  authoring contract for the Blender scene (named objects, mass-empty
  rotation conventions, export selection rules).

- **`claude_design/inverted_pendulum/handoff/INTEGRATION.md`** — runtime
  integration contract between the Blender export and the Three.js site
  (axis remap, pivot location, naming patterns).

- **`claude_design/inverted_pendulum/handoff/STORYBOARD.md`** — mode /
  beat plan (KIT / RUN / STUDIO sequencing) driving the UI in
  `index.html`.

- **`claude_design/inverted_pendulum/site/CLAUDE.md`** — operating manual
  for the site (file map, physics summary, axis conventions, mode keys,
  performance notes, re-export recipe, mesh-name patterns, dev-server
  command). The most up-to-date pointer document.

## Third-party fonts / icons

- **Fonts: Google Fonts** (single stylesheet `<link>` in
  `claude_design/inverted_pendulum/site/index.html` line 22, loaded with
  `display=swap`):
  - **Geist** — weights `300, 400, 500, 700, 900`. Used for the
    display headline (`PENDULUM.`) and body chrome via the
    `display` / default `font-family` classes.
  - **Geist Mono** — weights `400, 500, 600`. Used for the
    `mono-cap-sm` / `mono-cap` HUD strings, KPI numerals, and the
    share-frame canvas overlay text (`app.js` lines 977, 992).
  - **Instrument Serif** — italic axes `0, 1`. Used for the
    "`inverted.`" wordmark, the headline equation, and the Studio
    Math panel equation set via the `serif-i` class.
- **Preconnect hints** for both Google Fonts hosts are emitted in
  `index.html` (lines 20–21):
  `https://fonts.googleapis.com` and
  `https://fonts.gstatic.com` (the latter with `crossorigin`).
- **Icons: none.** No icon font, no SVG sprite set, no third-party
  icon library. The only iconography is:
  - The inline SVG data-URI favicon (acid-green dot on bone bg) in
    `index.html` line 19.
  - Unicode glyphs typed into the markup (`→`, `⤓`, `⧉`, `×`,
    bracket characters in chrome corners). All rendered by the
    bundled Google Fonts above.
