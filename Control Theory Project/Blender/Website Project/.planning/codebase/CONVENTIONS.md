# CONVENTIONS

Source-of-truth files this document codifies:

- `claude_design/inverted_pendulum/site/app.js` (1098 lines, single-module)
- `claude_design/inverted_pendulum/site/index.html` (300 lines)
- `claude_design/inverted_pendulum/site/styles.css` (494 lines)
- `claude_design/inverted_pendulum/site/CLAUDE.md` (project README)
- `claude_design/inverted_pendulum/handoff/animate.py` (Blender-side sim)
- `claude_design/inverted_pendulum/handoff/BLENDER_SPEC.md`

## JavaScript style (modules, ES2020 features, naming, comment density)

**Module system.** Native ES modules via `<script type="module" src="app.js?v=debug2">`
in `index.html`. Imports use the browser **importmap** declared in `index.html`
(`three` → unpkg CDN, `three/addons/` → examples/jsm). The importmap MUST
precede every `<link rel="modulepreload">` that names a bare specifier — see
`index.html` lines 28–41.

**ES2020+ features in active use:**

- `import` / `import * as THREE from 'three'` (bare specifier via importmap)
- Arrow functions used both as one-liners (`const wrap = a => { … }` in
  `app.js:38`) and as event handlers
- Object spread for camera-tween snapshotting:
  `camAnim = { ...targets[m], t: 0, dur: 0.85, … }` (`app.js:509`)
- Destructuring on physics step results: `const { V, i_ref, region } = controlVoltage(…)`
- Template literals everywhere for status strings and DOM text
- `Map` for the `partRegistry` (`app.js:278`)
- Optional chaining / nullish only where a graceful skip is needed
  (`obj.material && obj.material.isMeshStandardMaterial`)
- Top-level `await` is NOT used — the GLTFLoader callback handles async load

**Naming.**

- Physics constants live in a single uppercase object `PHYS` (`app.js:15–33`);
  derived members (`PHYS.theta0`, `PHYS.Tt`) are computed on the same object
  immediately after the literal block.
- Three.js scene singletons are lowercase: `renderer`, `scene`, `camera`,
  `controls`, `key`, `fill`, `rim`, `ambient`.
- Sim state object is `sim` (`app.js:415`), with `sim.state`, `sim.mode`,
  `sim.history`, `sim.lastTau`, `sim.lastV`, `sim.lastRegion`. Mode is a
  string literal: `'kit' | 'run' | 'studio'` for UI and
  `'swing' | 'off'` for the controller.
- UI router state is `uiState` (`app.js:454`) with the same string-literal
  discriminator pattern.
- Functions: `lowerCamel`. Verbs for actions (`setMode`, `pulseBob`,
  `drawPlot`, `pushTrail`, `applyKitHighlight`), nouns for predicates only
  when the predicate is a one-liner (`const isMassPart = (name) => /…/.test(name)`
  in `app.js:299`).
- DOM cache vars: same name as the element semantic role, suffixed with
  `El` when ambiguous (`loaderEl`, `heroEl`, `tweaksEl`, `heroEnter`,
  `kitCallout`, `subPillsContainer`).
- Two debug-only globals are hung off `window`: `window.__sim` and
  `window.__PHYS` (`app.js:426`) — the double-underscore prefix flags them
  as inspector-only.

**Comment density.** High in the physics/geometry sections and low in
the UI plumbing. Conventions observed in `app.js`:

- File header `// ── Renderer / scene ─────────` style banners separate
  sections (`app.js:98`, `:253`, `:414`, `:453`, `:547`, `:595`, `:609`,
  `:757`, `:895`, `:923`, `:930`, `:1032`).
- Multi-line `//` comment blocks above any non-obvious geometric reasoning,
  e.g. the swing-axis / `baseQuat` derivation at `app.js:368–391` and the
  pivot-discovery block at `:329–356`.
- Inline `// reason …` comments justify magic numbers (e.g. `> ~20 cm in one
  frame` justifying the `0.04` teleport threshold at `app.js:209`).
- Equation comments quote the paper notation directly (Unicode `θ̈`, `θ̇`,
  `ω`, `τ`) — see `app.js:7–14` and `:69–77`.
- No JSDoc. No TypeScript. No prop-type runtime checks.

## Physics naming (Greek letters, RK4 vars, state shape)

**Greek letters** are used as ASCII transliterations in identifiers and as
real Unicode in comments / DOM text:

| Symbol | Identifier | Notes |
|---|---|---|
| θ      | `theta`    | wrapped to `(-π, π]` via `wrap()` (`app.js:38`) |
| θ̇ (ω) | `omega`    | angular velocity, `rad/s` |
| θ̈     | `theta_ddot_c` | commanded angular acceleration (`app.js:49`) |
| τ      | `tau`      | motor torque, `τ = K·i` (`app.js:89`) |
| i      | `i`        | coil current, `A` |
| i_d    | `i_ref` / `i_d` | desired current from PD (`app.js:50`) |
| i̇_c   | `i_dot_c`  | commanded current rate (`app.js:51`) |
| V      | `V`        | terminal voltage, `V` |
| θ₀     | `PHYS.theta0` | limiting angle, derived (`app.js:35`) |
| T, T_t | `T`, `PHYS.Tt` | energy and threshold (`app.js:36`, `:44`) |

**State shape.** A 3-tuple plain object — never an array, never a class:

```js
sim.state = { theta: Math.PI, omega: 0.001, i: 0 };
```

Returned/scratch states from `rhs()` and the RK4 intermediates use the same
key set (`dtheta`, `domega`, `di` for derivatives; `theta`, `omega`, `i` for
states). The integrator output additionally carries diagnostics:
`{ theta, omega, i, V, tau, region }` (`app.js:90–95`).

**RK4 vars.** `k1..k4` for derivatives, `s2..s4` for intermediate states
(`app.js:82–87`). Fixed micro-step `dt = 0.001` s (`app.js:425`); `physicsStep`
substeps per real frame with `n = Math.max(1, Math.round(cap / dt))` and caps
`realDt` at `0.05` s to survive tab-idle (`app.js:428–433`).

**Region tag** is a string `'off' | 'idle' | 'pd' | 'swingup'` returned from
`controlVoltage` and cached on `sim.lastRegion` for both the gizmo tint
(`app.js:862–871`) and the KPI block (`app.js:754`).

**Sync with Blender.** `handoff/animate.py` carries an INDEPENDENT copy of
the same constants. Any change to `PHYS` in `app.js` must be mirrored in the
Blender script or the recorded `theta_history.json` and the live sim will
diverge. (See `TESTING.md` recommendation #3 for the shared-constants
proposal.)

## CSS naming (kebab tokens, CSS custom properties, type roles)

**All design tokens are CSS custom properties** declared once on `:root`
in `styles.css:1–18`:

```css
--lab:        #F5F3EE;          /* canvas */
--lab-2:      #EAE6DE;
--bone:       #0E0E0C;
--ink-on-lab: #0A0A08;
--mut-d:  rgba(10,10,8,.55);
--fnt-d:  rgba(10,10,8,.30);
--hair-d: rgba(10,10,8,.16);
--accent: #D4FF3A;
--accent-dim: #B7DD2C;
--warn:   #FF6A3D;
--display:'Geist', system-ui, sans-serif;
--serif:  'Instrument Serif', 'Times New Roman', serif;
--mono:   'Geist Mono', ui-monospace, monospace;
```

Naming conventions on the tokens:

- `--lab`, `--lab-2`, `--bone`, `--ink-on-lab` — semantic colour roles,
  not raw hex names. Roles encode "background canvas", "ink on canvas".
- Suffix `-d` (`--mut-d`, `--fnt-d`, `--hair-d`) marks the **dark-ink-on-light**
  variant — vestigial from the earlier dark theme; the project pivoted to a
  light "cutting-mat" palette but kept the variable names so existing rules
  inherit without renames (comment at `styles.css:2–4`).
- `--accent` and `--accent-dim` are swappable at runtime via the swatches
  panel (`app.js:1077` mutates `document.documentElement.style.setProperty('--accent', c)`).

**Class naming.** All kebab-case, no BEM, no utility-first:

- Structural: `.chrome-tl`, `.chrome-tr`, `.chrome-bl`, `.chrome-br` for the
  four corner-chrome blocks.
- Type roles: `.mono-cap`, `.mono-cap-sm`, `.display`, `.serif-i`, `.muted`,
  `.accent` (`styles.css:60–67`). Compose with regular class lists.
- Component roots: `.pill`, `.panel`, `.callout`, `.loader`, `.hero`,
  `.tweaks`, `.toast`, `.brackets`.
- Component variants: `.pill.sub`, `.pill.active`, `.panel.visible`,
  `.kpi.accent-kpi`.
- State classes: `.hidden` (global helper, `styles.css:330`), `.visible`,
  `.gone`, `.go` (hero animation trigger), `.show`, `.entered` and
  `.advanced` set on `<body>` to gate post-hero chrome and the `?` reveal
  (`styles.css:316–327`).
- Animation classes: `.hero-fade` + `.hero-d1` … `.hero-d6` for the
  progressive reveal delays (`styles.css:391–402`).
- Body utility: `.mat-d` on `<body>` renders the cutting-mat grid background
  (`styles.css:37–45`).

**Type roles.**

- Display headline → `var(--display)` (`Geist`, weight 900)
- Italic accent → `var(--serif)` (`Instrument Serif`)
- Mono caps → `var(--mono)` with `letter-spacing: .18em; text-transform: uppercase;`
  in two sizes (`.mono-cap` = 10px, `.mono-cap-sm` = 9px)

## DOM ID conventions

IDs are kebab-case and grouped by a short prefix that signals their domain:

- `stage` — the single Three.js canvas (`index.html:63`).
- `loader`, `loader-bar-fill`, `loader-status` — boot screen.
- `hero`, `hero-enter` — intro overlay.
- `pills`, `sub-pills` — mode pickers (children selected by
  `[data-mode]` / `[data-sub]`, not by id).
- `panel-diagram`, `panel-plots`, `panel-math` — Studio sub-panels, looked
  up via the `panels` map in `app.js:464–468`.
- `b-num`, `b-label`, `b-hint` — bottom-bar mode badge text targets.
- `r-theta`, `r-omega`, `r-tau`, `r-fps` — `r-` prefix = readout HUD targets
  (`app.js:822–825`).
- `k-thmax`, `k-tmax`, `k-settle`, `k-region` — `k-` prefix = KPI cell
  targets (`app.js:751–754`).
- `kit-num`, `kit-name`, `kit-sub`, `kit-callout` — KIT-mode callout
  (`app.js:578–581`).
- `plot-theta`, `plot-tau`, `plot-poles`, `plot-current`, `plot-phase` —
  `plot-` prefix on each `<canvas>` (`app.js:610–614`).
- `tweaks`, `tweaks-open`, `tweaks-close`, `t-kp`, `t-kd`, `t-tmax`,
  `t-ca`, `t-mode`, `t-reset`, `t-perturb`, plus value mirrors
  `t-kp-val` / `t-kd-val` / `t-tmax-val` / `t-ca-val` — `t-` prefix on
  all tweak controls (`app.js:1043–1071`).
- `share-frame` — share-PNG button (`app.js:941`).
- `toast` — single global toast surface (`app.js:933–939`).

`data-*` attributes are used instead of ids when there are repeated
controls in a group: `data-mode` on `.pill`, `data-sub` on `.pill.sub`,
`data-c` on `.swatches .sw`.

## Three.js naming + part registry / regex matching (`isMassPart` pattern)

**Scene singletons** kept at module scope (`app.js:99–156`): `renderer`,
`scene`, `camera`, `controls`, `pmrem`, `envTex`, `key`, `fill`, `rim`,
`ambient`, `gizmoScene`, `gizmoCam`, `ground`. Each is added to its parent
scene at construction site.

**Loader pipeline.** `DRACOLoader` warmed before the `GLTFLoader` runs
(`app.js:254–258`). Decoder pulled from
`https://www.gstatic.com/draco/versioned/decoders/1.5.6/`, preconnected via
`<link>` in `index.html:25–26`.

**Part registry.** After GLB load, every mesh is tagged into a `Map`:

```js
let partRegistry = new Map(); // name → object (for KIT highlighting)
root.traverse(obj => {
  if (obj.isMesh) {
    …
    partRegistry.set(obj.name, obj);
    if (isMassPart(obj.name)) massMeshes.push(obj);
  }
});
```

(`app.js:278`, `:301–315`)

**Regex matching for mesh names.** GLTFLoader replaces spaces in node names
with underscores, so the canonical pattern is a case-insensitive regex over
the underscore form:

```js
const isMassPart = (name) =>
  /^(ct[ _].*coupler|mass_big_bolt|mass_small_bolt|mass_screw|swinging_support_rod)/i
    .test(name);
```

(`app.js:299`) — note the `ct[ _]` alternation in the first capture so
matches survive whichever exporter was used.

**Tip probe** (single source of truth for the trail) is identified by a
narrower pattern and stashed in a module-level singleton `tipProbe`:

```js
if (/^mass_big_bolt_U/.test(obj.name)) tipProbe = obj;
```

(`app.js:324`)

**KIT label table.** `partLabels` array (`app.js:279–287`) maps display
metadata to **substring keys** (not regex). Match is `entry.keys.some(k =>
name.includes(k))` in `applyKitHighlight` (`app.js:562`).

**Material decoration.** Every `MeshStandardMaterial` is **cloned** so the
KIT highlight cycle can swing `emissive` / `emissiveIntensity` / `color`
per-mesh without bleeding across instances. The original colour is stashed
under `material.userData.baseColor` and the idle emission under
`material.userData.idleEmission` (`app.js:305–321`). All restorations read
from `userData` — never from a parallel structure.

**Pivot construction.** A fresh `THREE.Group` named `_pendulum_pivot` is
placed at the encoder-coupler centre and the mass-part meshes are reparented
into it with `pendulumGroup.attach(m)` (preserves world transform)
— see `app.js:359–366`. The pendulum's rotation pole is encoded in:

- `pendulumGroup.userData.rodLength`
- `pendulumGroup.userData.restDir`
- `pendulumGroup.userData.baseQuat` — maps GLB rest pose to upright
- `pendulumGroup.userData.swingAxis` — `new THREE.Vector3(0, 0, -1)`

These are read each frame in the render loop (`app.js:780–786`).

## Cache-busting strategy (per-minute URL on GLB)

The GLB URL is rebuilt every minute so re-exports from Blender propagate
during a dev session without forcing a hard reload:

```js
const V = Math.floor(Date.now()/60000);
const GLB_URL = `assets/pendulum.glb?v=${V}`;
```

(`app.js:261–262`) The same `V` is NOT used on `styles.css` — the stylesheet
relies on standard HTTP cache. The `app.js` script tag is manually versioned:
`<script type="module" src="app.js?v=debug2">` (`index.html:298`) — bump the
literal when shipping.

The `<link rel="preload" href="assets/pendulum.glb" as="fetch" crossorigin>`
tag in `index.html:43` is intentionally URL-bare (no `?v=…`) so the browser
satisfies the preload from RAM whenever `Date.now()` ticks into a new minute
between preload-emit and GLB-request.

## Magic numbers (literal world coords, swing axis, FOV defaults, key-pose camera positions)

**World-frame anchors** (Three Y-up, after Blender Z-up → Y-up swap):

| Constant | Value | Where | Meaning |
|---|---|---|---|
| Pivot world pos | `(-0.20, 1.48, 0.07)` | `app.js:332` (fallback) | encoder coupler centre; auto-located from the `'ct encoder coupler v4 (Meshed)'` mesh box if present |
| Rod length default | `1.36` m | `app.js:342` | overwritten by the rod-mesh bounding box |
| Rod rest direction default | `(0, 0, -1)` | `app.js:341` | overwritten by the pivot-to-bob vector |
| Ground plane y | `-0.275` | `app.js:249` | shadow-catcher under the cutting mat |

**Swing axis** is `Vector3(0, 0, -1)` (`app.js:391`). Rationale: the
encoder/motor shaft is `+Y` in Blender's frame; Y-up export maps Blender `+Y`
to three `-Z`. The `baseQuat` (`app.js:383–386`) rotates GLB-authored bob
`+X` → upright `+Y` so `θ = 0` reads as upright.

**Camera defaults.**

- Initial: `position = (5.2, 1.6, 0.05)`, `lookAt(-0.2, 1.5, 0.05)`,
  FOV = 46, near = 0.05, far = 80 (`app.js:120–122`).
- `OrbitControls`: damping 0.08, distance ∈ [2.4, 10], `maxPolarAngle =
  0.62π`, panning disabled (`app.js:126–132`).

**Key-pose camera targets** (per UI mode) in `app.js:504–508`:

| Mode | `pos` | `look` | `fov` |
|---|---|---|---|
| `kit`    | `(4.6, 4.4, 4.8)`  | `(0,    1.0,  0.05)` | 38 |
| `run`    | `(5.2, 1.6, 0.05)` | `(-0.2, 1.50, 0.05)` | 46 |
| `studio` | `(4.4, 1.5, 0.05)` | `(-0.2, 1.45, 0.05)` | 44 |

Tween dur = `0.85` s with cubic ease-out (`app.js:509`, `:597`).

**Physics-side magic numbers** (paper-derived; see `app.js:15–33`):

- `dt = 0.001` s integrator step (`app.js:425`)
- `realDt` cap = `0.05` s (`app.js:432`) to survive tab idle
- Trail length = 64 frames (`app.js:187`)
- Trail teleport threshold = squared `> 0.04` (i.e. > 20 cm) (`app.js:209`)
- `sim.history` retention window = 6 s (`app.js:449`)
- Plot time window = 6 s, hard-coded in `drawPlot` (`app.js:724`)
- Pole-zero plot: real axis `[-20, 5]`, imag `[-10, 10]`, poles
  `[-14.27, -2.94, 0.01]` from paper §V (`app.js:667–683`)
- Phase portrait: θ ∈ [-π, π], ω ∈ [-10, 10] (`app.js:624–625`)
- Perturb impulse: ±4.0 rad/s (Space/click) (`app.js:538`, `:1069`)
- Click-perturb (RUN): ±3.0 rad/s (`app.js:926`)
- KIT auto-cycle period: 3.6 s (`app.js:811`)
- PD "settled" predicate: `region === 'pd' && |θ| < 0.05` (`app.js:746`)
- Share-frame render size: 1920 × 1080 (`app.js:943`)
- Reduced-motion guard: **none currently**

The render-loop relies on `renderer.preserveDrawingBuffer = true`
(`app.js:100`) so `share-frame` can read the latest pixels into a 2D canvas.
