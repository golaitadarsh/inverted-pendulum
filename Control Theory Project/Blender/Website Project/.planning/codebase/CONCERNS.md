# CONCERNS

Risk register for the inverted-pendulum Three.js + Blender pipeline. Each
item is grounded in `claude_design/inverted_pendulum/site/app.js`,
`index.html`, `styles.css`, `handoff/BLENDER_SPEC.md`, and
`site/CLAUDE.md`. Line numbers verified against current files.

## HIGH severity

### H1 — R-reset handler drops the `i` field, freezes the sim

`claude_design/inverted_pendulum/site/app.js:537`

```js
else if (e.key === 'r' || e.key === 'R') {
  sim.state = { theta: Math.PI - 0.01, omega: 0 };
  sim.history.length = 0;
}
```

The reset literal omits `i`. On the next tick, `rk4` reads
`sim.state.i === undefined` (see `rhs` at `app.js:74-76` and `rk4` at
`app.js:78-96`), which propagates `NaN` through every derivative. The
`isFinite` guard inside `physicsStep` at `app.js:435-441` then re-seats
state to `{ theta: Math.PI, omega: 0.001, i: 0 }` on every substep,
which keeps the integrator alive but starves it of forward progress —
the rendered pendulum reads as visually frozen at θ = π. Compare with
the working reset at `app.js:1063-1067` (tweaks panel) which correctly
includes `i: 0`. Fix: spread or replace with the full 3-state literal,
or factor a single `RESET_STATE` constant used by both call sites.

### H2 — Hardcoded pivot world position and rod length couple web to one GLB

`claude_design/inverted_pendulum/site/app.js:332` (`pivotPos = new THREE.Vector3(-0.20, 1.48, 0.07)`)
`claude_design/inverted_pendulum/site/app.js:342` (`rodLength = 1.36`)
`claude_design/inverted_pendulum/site/app.js:128` (orbit target `(-0.1, 1.50, 0.05)`)
`claude_design/inverted_pendulum/site/app.js:496-509` (per-mode camera look targets all hardcode `(-0.2, 1.5*, 0.05)`)

The fallback pivot and rod length are seeded from the *current*
Blender export. The real pivot is recomputed from
`partRegistry.get('ct encoder coupler v4 (Meshed)')` (`app.js:331`) and
rod length from a single `swinging_support_rod` bbox
(`app.js:343-356`), but if those exact names change in Blender — or if
the encoder coupler is renamed during a remodel — the fallbacks silently
take over and the visualization desynchronizes from the physics. The
camera tweens never re-read the pivot, so any pivot shift also miscentres
all three modes' framing. See `site/CLAUDE.md:31` which documents
`(-0.20, 1.48, 0.07)` as a "convention", not a runtime contract.

### H3 — `baseQuat` assumes the GLB authors bob at +X offset (silent invariant)

`claude_design/inverted_pendulum/site/app.js:373-391`

```js
pendulumGroup.userData.baseQuat = new THREE.Quaternion().setFromUnitVectors(
  new THREE.Vector3(1, 0, 0),  // assumes GLB bob authored at +X
  uprightDir
);
pendulumGroup.userData.swingAxis = new THREE.Vector3(0, 0, -1);
```

The "+X authored bob" invariant is documented in `site/CLAUDE.md:35-36`
("`baseQuat` rotates GLB-authored bob direction `+X` → upright `+Y`")
but is nowhere enforced at runtime. If Blender re-export drops the bob
in any other rest orientation (e.g. after the documented `mass`
rotation reset in `site/CLAUDE.md:48`), the visual rotation is wrong
but the physics still ticks, so the bug looks like "the model is
broken" rather than a contract violation. No assertion compares the
authored bob direction against the expected `+X`.

### H4 — Bundled `pendulum.glb` is 10.6 MB; slow first paint on mobile

`claude_design/inverted_pendulum/site/assets/pendulum.glb` (11 150 376 bytes, confirmed via `ls -la`)
`claude_design/inverted_pendulum/site/CLAUDE.md:11` ("`assets/pendulum.glb` — 10.6 MB Draco GLB")
`claude_design/inverted_pendulum/site/index.html:43` (`<link rel="preload" href="assets/pendulum.glb" as="fetch" crossorigin />`)

Even Draco-compressed, this is a hostile payload on 3G/4G. The loader
UX (`index.html:48-60`, `app.js:264-272`, `app.js:405-411`) handles
progress, but the *first contentful interaction* still blocks on a
~10 MB transfer plus a Draco WASM round-trip from `gstatic.com`
(`app.js:254-256`). No lower-LOD GLB and no skeleton/placeholder
geometry is preloaded.

### H5 — No `scene_meta.json` runtime contract; KIT highlighting matches by literal/regex names

`claude_design/inverted_pendulum/site/app.js:279-287` (`partLabels`, hand-curated keys)
`claude_design/inverted_pendulum/site/app.js:299` (`isMassPart` regex)
`claude_design/inverted_pendulum/site/app.js:331` (literal `'ct encoder coupler v4 (Meshed)'`)
`claude_design/inverted_pendulum/site/app.js:343` (regex `^swinging_support_rod`)
`claude_design/inverted_pendulum/site/app.js:561-562` (KIT highlight via `name.includes(k)`)
`claude_design/inverted_pendulum/site/CLAUDE.md:14` notes `scene_meta.json` is "unused at runtime"

GLTFLoader silently rewrites spaces in node names to underscores
(`app.js:298`, `site/CLAUDE.md:108-115`), so KIT auto-cycle relies on
substring matches that can break invisibly on rename. A re-export with
a different naming pass (e.g. tool-prefixed names) will degrade
gracefully — the page won't error, parts just stop lighting up — which
is the worst failure mode for a visual product.

## MEDIUM severity

### M1 — PD region θ₀ clamped to π/2 because `mgl` is small relative to paper's `Vmax`

`claude_design/inverted_pendulum/site/app.js:35`
`PHYS.theta0 = Math.asin(Math.min(1, (PHYS.K * PHYS.Vmax) / (PHYS.m * PHYS.g * PHYS.l * PHYS.R)))`

With `K = 1.1112`, `Vmax = 6`, `m = 0.5`, `g = 9.81`, `l = 0.30`,
`R = 2.3634`, the inner ratio is
`(1.1112 · 6) / (0.5 · 9.81 · 0.30 · 2.3634) ≈ 1.92`, which clamps to
1.0 → `θ₀ = π/2`. The PD region therefore covers nearly the whole
half-circle, so the destabilizer almost never fires in `controlVoltage`
(`app.js:47-62`). Physically the paper's intent is "pump first, catch
late". The choice of `m`, `l` is admitted to be a guess in the source
comment at `app.js:21-23`. Either source `m`, `l` from the paper or
re-derive a believable demo regime.

### M2 — No mobile / touch interaction layer

`claude_design/inverted_pendulum/site/app.js:524-541` (only `keydown`)
`claude_design/inverted_pendulum/site/app.js:924-928` (canvas `click` perturb, but no `touchstart`)
`claude_design/inverted_pendulum/site/styles.css:466` (sole `@media (max-width: 720px)` block)

There is no touch-equivalent for `Space` (perturb), `R` (reset),
`1/2/3` (modes), or for the gizmo. OrbitControls supplies touch
orbiting in RUN/STUDIO, but mode switching and core perturbation are
keyboard-only. Combined with the 10 MB GLB (H4), mobile is effectively
not a supported platform.

### M3 — No `prefers-reduced-motion` guard for camera tweens, bob pulse, or KIT auto-cycle

Confirmed absent across `styles.css` and `app.js` via grep.
Affected animations: camera tween (`app.js:597-607`, 0.85 s ease-out
per mode change), bob emission pulse (`app.js:794-799`), KIT
auto-cycle (`app.js:808-816`, 3.6 s cadence), hero reveal
(`app.js:900-904`). Vestibular users get no opt-out.

### M4 — `state.theta` integration is unbounded; long sessions accumulate revolutions

`claude_design/inverted_pendulum/site/app.js:91` (`state.theta + dt*(…)/6`, never wrapped)
`claude_design/inverted_pendulum/site/app.js:38` (`wrap` exists but only applied at display/render — see lines `42, 448, 742, 784, 822, 849, 993`)

`wrap(...)` is called only on outputs (controller input, plot/HUD
text, gizmo dot, render quaternion), never written back to `sim.state`.
Over hours of swing-up cycles `theta` accumulates many `2π` rotations,
eventually eroding the precision of `Math.sin(theta)` in `rhs`
(`app.js:74`) and of the swing quaternion in the frame loop
(`app.js:783-786`). Write the wrapped value back to `sim.state.theta`
in `physicsStep`.

### M5 — No ARIA-live announcement of region change (`idle → swingup → pd`)

`claude_design/inverted_pendulum/site/index.html:206` (`<span id="k-region">idle</span>`)
`claude_design/inverted_pendulum/site/app.js:754` (text-only update)

`#k-region` updates silently. Screen-reader users get no signal that
the controller transitioned. Adding `aria-live="polite"` plus an
`aria-atomic="true"` on the wrapping `.kpi.accent-kpi` is one line.

## LOW severity

### L1 — Modulepreload + `preload as=fetch` warning logged in browser

`claude_design/inverted_pendulum/site/index.html:43`
`<link rel="preload" href="assets/pendulum.glb" as="fetch" crossorigin />`

Chrome warns that `as=fetch` preloads without an explicit
`fetchpriority` or `Vary`-equivalent matching the actual GLTFLoader
fetch will not be reused, polluting devtools. Either drop the preload
or align it with the request (e.g. switch the loader to a hinted
`fetch()` call).

### L2 — `handoff/theta_history.json` unused at runtime

`claude_design/inverted_pendulum/handoff/theta_history.json` (38 072 bytes)

Referenced only by `BLENDER_SPEC.md:91` ("`theta_history.json` is
present in this folder") and the Blender animation pipeline. The web
build neither fetches nor links to it. Safe to leave, but it is dead
weight in the repo from the site's perspective — flag in docs that it
is render-pipeline-only.

### L3 — Per-minute cache-bust is too coarse for tight dev loops

`claude_design/inverted_pendulum/site/app.js:261-262`

```js
const V = Math.floor(Date.now()/60000);
const GLB_URL = `assets/pendulum.glb?v=${V}`;
```

Two re-exports inside the same wall-clock minute will both hit the
browser's cached entry. Use the GLB's `mtime` (via a tiny build step)
or a content hash for deterministic busting; or fall back to a hard
reload during Blender iteration.

## Opportunities

### O1 — Introduce a `scene_meta.json` runtime contract

Have a Blender export script (`handoff/export_pendulum.py`) emit a
sibling JSON with:

```json
{
  "pivot_world": [-0.20, 1.48, 0.07],
  "swing_axis": [0, 0, -1],
  "rest_bob_dir": [1, 0, 0],
  "rod_length": 1.36,
  "parts_by_role": {
    "bob_tip": "mass_big_bolt_U.001",
    "rod":     "swinging_support_rod",
    "pivot":   "ct encoder coupler v4 (Meshed)",
    "highlights": {
      "controller": ["arduino_uno"],
      "motor":      ["Motor - RS-775"],
      "...":        []
    }
  }
}
```

Then replace the hardcoded constants at `app.js:332, 342, 374-391` and
`partLabels[*].keys` (`app.js:279-287`) with values read from this
file. Resolves H2, H3, and H5 in one step. The existing
`assets/scene_meta.json` already exists (per `site/CLAUDE.md:14`); it
just needs schema + readers.

### O2 — Single-source physics params (paper Table III) in a shared JSON

The same `PHYS` constants live in `app.js:15-33` (web) and in
`handoff/animate.py` (Blender renderer, per repo). Pull both into
`handoff/physics.json`; the web build imports it via `fetch`, the
Python build via `json.load`. Prevents drift between the recorded
`theta_history.json` and the live web sim.

### O3 — Headless smoke test (Playwright)

Add `tests/smoke.spec.ts`:

1. Load `http://localhost:8765/index.html`.
2. Dismiss hero (`page.click('#hero-enter')`).
3. Read `window.__sim` every 100 ms for 5 s.
4. Assert: `sim.state.theta` finite throughout; `sim.lastRegion`
   transitions through `idle → swingup → pd` at least once;
   `Math.abs(sim.state.omega)` reaches some `> 1` threshold before the
   catch.

This would have caught H1 in CI. Hooks into the playwright MCP that's
already available in this workspace.

### O4 — Compress `pendulum.glb` further (KTX2 + tighter Draco)

The current export at `site/CLAUDE.md:80-92` uses JPEG q80 textures at
1024² and Draco position quantization 14. Replacing JPEG with **KTX2
(Basis Universal, UASTC for normal maps, ETC1S for albedo)** typically
cuts texture payload 40-60%. Dropping Draco position quantization to
12 (still imperceptible for a 30 cm rod at 1 m distance) shaves
another ~10% off mesh. Realistic target: 4-5 MB. Combined with O1
(static `scene_meta.json` letting us skip the full bbox traversal
fallback), first interaction time on mobile becomes acceptable.
