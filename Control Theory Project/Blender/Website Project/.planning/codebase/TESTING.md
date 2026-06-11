# TESTING

There are no automated tests in this project. Every verification surface
today is **manual** or **runtime**. The sections below enumerate what
exists, what does not, and the priority-ordered additions that would give
the most coverage per hour of effort.

## Existing surfaces (manual)

All manual surfaces are reached by starting the dev server and opening
`http://localhost:8765/index.html`:

```
cd claude_design/inverted_pendulum/site
python3 -m http.server 8765
```

Visible manual-verification surfaces:

- **Mode router.** `1` / `2` / `3` (or the bottom `.pills`) switch
  `kit | run | studio`. Each mode reframes the camera with an `easeOut`
  tween (see `app.js:504–510`) and toggles OrbitControls (`app.js:481`).
  Visual confirmation that the right preset fires and the swing arc fits
  the frustum.
- **Studio sub-panels.** `D` / `P` / `M` (or `.pill.sub`) cycle the
  Diagram / Plots / Math panels. Diagram is static SVG-like markup
  (`index.html:154–167`). Plots is canvas-driven. Math lists paper
  equations and gains for inspection (`index.html:211–246`).
- **Tweaks panel** (`T` key or the `[ T ] TWEAKS` FAB). Live sliders for
  `Kp` (20–400), `Kd` (0–80), `V_max` (2–12 V), and a derived (read-only)
  `θ₀` (`index.html:255–261`, `app.js:1043–1060`). Use this to confirm:
  - Pushing `Kp` too high reveals chatter on `θ(t)`.
  - Dropping `V_max` near `mglR/K` collapses `θ₀` and the catch window.
  - The `Mode` dropdown switches `swing` ↔ `off` for free-fall checks.
- **Perturb / Reset.** `Space` (also `[ PERTURB ]` button) injects
  ±4.0 rad/s on `ω`; `R` (also `[ RESET ]` button) snaps state back to
  `θ = π - 0.01`, `ω = 0` (`app.js:537–538`, `:1063–1071`). The
  expected manual outcome is: PD region holds through a single perturb;
  a stack of perturbs eventually kicks back into `swingup`.
- **Studio Plots tab** (`index.html:170–208`). Five live traces:
  - `θ(t)` over a 6 s window
  - `τ(t)` over a 6 s window
  - Open-loop pole-zero on the s-plane (poles −14.27, −2.94, +0.01 per
    paper §V) — RHP shaded for visual stability check
  - `i(t)` motor current over a 6 s window
  - `θ` vs `θ̇` phase portrait, full 6 s history
- **KPI block** (`index.html:199–207`, `app.js:741–755`):
  - `|θ|_max` (rad, accumulated since last reset)
  - `|τ|_max` (N·m, accumulated since last reset)
  - `SETTLE` — seconds since the controller entered the `pd` region
    with `|θ| < 0.05`. Target value annotated as `0.29 s` per paper
    design.
  - `REGION` — live label, accent-tinted via `.kpi.accent-kpi`.
- **KIT auto-cycle.** In KIT mode, the part registry advances every
  3.6 s (`app.js:811`) and `kit-callout` updates with name + spec.
  Use to confirm `partLabels` entries (`app.js:279–287`) all match
  meshes in the current GLB.

## Existing surfaces (live diagnostics)

These are runtime instruments — read them while interacting:

- **HUD readout** (`chrome-tr`, `index.html:111–117`): `θ`, `θ̇`, `τ`
  and `FPS` updated every frame in `frame()` (`app.js:822–825`).
- **FPS counter.** Computed in a 0.5 s rolling window
  (`app.js:766–767`). A drop below 50 typically means the GLB
  materials weren't cloned or shadows are mis-configured.
- **NaN guard at the integrator.** `physicsStep` checks every RK4 result
  with `isFinite` on `theta`, `omega`, `i`; on Inf/NaN it resets to
  `{ theta: π, omega: 0.001, i: 0 }` and clears region/torque caches
  (`app.js:435–441`). The sim is therefore self-recovering after long
  page-idle — verified by deliberately backgrounding the tab for >60 s
  and watching it boot back into `swingup`.
- **Debug globals.** `window.__sim` and `window.__PHYS` are hung off
  `window` (`app.js:426`) for DevTools inspection. Useful manual
  commands while running:
  - `__sim.state` — current `{ theta, omega, i }`
  - `__sim.history.length` — should stabilise at ~6000 / frame-dt
  - `__PHYS.theta0` — recomputed by the V_max slider
- **Trail teleport guard.** Any frame-to-frame tip jump > 20 cm (squared
  distance > 0.04) clears the rod-tip trail to avoid a chord through
  the world after a perturb or wrap (`app.js:207–214`).
- **Share-frame PNG.** `[ ⤓ ] FRAME` button renders a fresh
  1920 × 1080 frame, composites design chrome via a 2D canvas, and
  triggers a PNG download (or copies to clipboard on Shift+click) —
  `app.js:941–1030`. Inspecting the PNG offline is a manual
  regression check for material/lighting setup.
- **Status pipeline.** `setStatus(text, pct)` (`app.js:268`) drives the
  loader bar. Boot-time progress mirrors the GLTFLoader `onProgress`
  byte counter; failure paths flip to `ERROR · CHECK CONSOLE`
  (`app.js:411`).
- **Console error logging.** GLB load failures go to `console.error`
  (`app.js:411`); the loader UI also displays the error state.

## What is missing

The project ships zero automated coverage. Concretely absent today:

- **No unit tests.** `rk4`, `rhs`, `controlVoltage`, and `wrap` in
  `app.js` are pure functions with deterministic outputs and would be
  trivially testable, but no harness exists.
- **No GLB schema validation.** The named-mesh contract documented in
  `claude_design/inverted_pendulum/site/CLAUDE.md` (rod, mass bolts,
  encoder coupler, etc.) is enforced only by `isMassPart` regex hits
  at load time. A re-export that drops or renames any part fails
  silently — the pivot fallback at `app.js:332` and the rod-length
  default at `app.js:342` mask the regression with a wrong-but-plausible
  pose.
- **No CI.** No GitHub Actions, no pre-commit, no linter configured for
  the site bundle.
- **No visual regression suite.** Share-frame PNGs are produced
  ad-hoc and never diffed.
- **No headless physics smoke test.** Nothing asserts that, given the
  default seed, the simulator transitions
  `swingup → pd` within an expected window.
- **No sync check between Blender and web sim.** `handoff/animate.py`
  and `app.js` carry duplicate physics constants; drift goes unnoticed
  until somebody plays the rendered animation next to the live page.
- **No `prefers-reduced-motion` handling.** The camera tween
  (`app.js:597–607`) and the KIT auto-cycle (`app.js:807–816`) run
  unconditionally; both are vestibular-trigger candidates.
- **No accessibility audit.** Aria-labels exist on `tweaks-open`,
  `tweaks-close`, `share-frame` only.

## Recommended additions (priority-ordered)

1. **Headless physics + region-transition smoke test** (highest signal,
   lowest cost). Use Playwright or Puppeteer to:
   - Boot the dev server on `8765`
   - Navigate to `/index.html`
   - Wait for the loader's `gone` class on `#loader`
   - Programmatically dismiss the hero (`document.getElementById('hero-enter').click()`)
   - Poll `window.__sim.lastRegion` and `window.__sim.state` for 5 s
   - Assert the region sequence includes `swingup` then `pd`
   - Assert `|wrap(__sim.state.theta)| < 0.10` at t = 5 s
   - Optional: capture a Three.js screenshot for visual diffing
   This single test would catch (a) GLB load regressions, (b) integrator
   blowups, (c) controller mis-wiring, (d) Three import-map breakage.

2. **JSON Schema for `assets/scene_meta.json` + load-time validation.**
   The file already exists but is currently unused at runtime
   (`claude_design/inverted_pendulum/site/CLAUDE.md`). Extend it with
   the named-mesh manifest (the substring keys in `partLabels` and the
   regex parts in `isMassPart`), then validate at GLB-load time. If a
   required part is missing, surface a visible warning instead of
   falling back silently. Tooling option: `ajv` standalone bundle, or a
   hand-rolled `requiredParts.every(k => partRegistry.has(k))` check.

3. **Shared physics constants module** between `animate.py` and
   `app.js`. Pick a single JSON or `.js`-exporting-default file
   (`claude_design/inverted_pendulum/shared/phys.json` would be the
   natural home) and have the Blender side import it at script start
   while `app.js` fetches it before the first `physicsStep`. Removes
   the "two copies of `J`, `b`, `K`, `R`, `L`, `Kp`, `Kd`, `Kp_i`,
   `Vmax`" drift hazard documented in `CONVENTIONS.md` under "Physics
   naming → Sync with Blender".

4. **`prefers-reduced-motion` guard** for camera tweens and KIT
   auto-cycle:
   - Wrap `stepCamAnim` (`app.js:598`) so it snaps to the target pose
     on the first frame when the media query matches.
   - In KIT mode, freeze `uiState.kitTimer` and advance the highlight
     index only on explicit click/keypress when reduced motion is on.
   - Apply the same gate to the hero-fade keyframes
     (`styles.css:393–402`) — use a `@media (prefers-reduced-motion:
     reduce)` block that sets `animation: none` and `opacity: 1`.

Additional optional follow-ups once the above land:

- Unit tests for `rk4` / `wrap` / `controlVoltage` using `vitest`
  (no DOM dependency, pure-function module).
- Visual regression on the share-frame PNG via `pixelmatch` against a
  committed baseline at a fixed sim timestamp.
- Lighthouse CI for the static bundle (perf budget on FCP and TBT
  given the 10.6 MB Draco GLB).
