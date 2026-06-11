# Inverted Pendulum — Live 3D Site

Interactive 3D inverted pendulum built from real Blender geometry. Physics
per CT_Project paper (Patel/Kurle/Golait/Kanwat 2022).

## Files

- `index.html` — page shell, head meta, importmap, hero overlay, panels.
- `app.js` — Three.js scene, RK4 physics, controller, mode router, plots.
- `styles.css` — Claude design system tokens, light theme, breakpoints.
- `assets/pendulum.glb` — 10.6 MB Draco GLB composed in Blender:
  - All rig parts (motor, encoder, stands, base, breadboard, PSU, Arduino).
  - User-provided `cutting_mat.glb` imported + scaled (~5.45m).
  - PolyHaven `metal_plate` + `metal_plate_02` textures, JPEG q80, 1024²
    (legacy — overridden at load, see Materials below).
- `assets/scene_meta.json` — world-bounds metadata (unused at runtime;
  ORIGINAL Blender names with spaces — handy to predict sanitized GLB names).
- `assets/og.jpg` — 1200×630 social share image (hero at balanced upright).
  og:image/twitter:image are ABSOLUTE to production:
  `https://inverted-pendulum-two.vercel.app/` (Vercel project
  `inverted-pendulum`, scope adarsh-golaits-projects).

## Materials (runtime override, Blender-faithful)

The .blend has moved to procedural materials that glTF can't export, so the
GLB's stale `metal_plate*` textures are replaced in the load traverse with
value-noise CanvasTextures sampled from the Blender color-ramp stops:

| GLB material | Meshes | Blender truth | Web override |
|---|---|---|---|
| `metal_plate`, `mat.base_bottom`, `mat.base_top` | stands, dividers, base | `MDF_Procedural` ramp (0.55,0.40,0.25)→(0.78,0.60,0.40) | `MDF_TEX` grain, metal 0, rough 0.85 |
| `metal_plate_02` (rod, couplers) | swinging_support_rod, ct\_\*\_coupler | `Aluminum_Brushed` 0.72 | #DDDDDF, metal 1, rough 0.35 |
| `metal_plate_02` (bolts) | mass\_\*\_bolt, mass_screw | `Steel_Galvanized` ramp | `STEEL_TEX` grain, metal 1, rough 0.5, env 1.25 |
| everything else | motor, PCB, PSU, breadboard, encoder, mat | flat factors | untouched (already correct) |

If Blender materials change again: re-measure ramp stops via MCP
(`material.node_tree` VALTORGB elements) and update `makeGrainTexture` calls.

## Cutting-mat re-seat (runtime)

The GLB's mat (`Object_2`) predates the final .blend layout: it shipped
5.45 m wide, off-center, with the rig feet 0.30 below its surface. The load
traverse wraps it in a `_mat_reseat` group and rebuilds Blender truth from
live bounding boxes: scaled to 11.044 m wide (world-axis scale so thickness
stays 31 mm), concentric with `base_bottom` (mat center 35 mm behind base
center in web −z), top surface flush under the `base_divider` feet. The
shadow ground re-tucks under the new mat bottom. If the GLB is ever
re-exported with the current Blender layout, this re-seat converges to a
no-op (scale→1, offsets→0) — safe to keep.

## Physics (per CT_Project paper)

Plant: `J θ̈ + b θ̇ = K i + m g l sin(θ)` (eq 1)
Motor: `L i̇ + i R = V − K θ̇` (eq 2)
Destabilizer (|θ| ≥ θ₀): `V = V_max · sgn(θ̇)` with energy switch `T < T_t`
Stabiliser (|θ| < θ₀): cascaded PD position → desired current → P current → V
  with feedforward (eqs 15, 17, 18)

Params MIRROR `physics/pendulum_sim.py` PARAMS — single source, keep in sync.

| Param | Value | Source |
|---|---|---|
| R | 2.3634 Ω | paper Table III |
| L | 0.9794 H | paper Table III |
| Kp | 196 | §V eq 23 |
| Kd | 28 | §V eq 24 |
| Kp,i | 446 | §V eq 25 |
| J | 0.00467 kg·m² | **CAD** (`mass_properties.py`) |
| m | 0.1501 kg | **CAD** |
| l | 0.1655 m | **CAD** (mgl = 0.244 N·m) |
| K | 0.06 V·s | **viz profile** |
| b | 0.003 N·m·s | **viz profile** |
| Vmax | 7 V | **viz profile** (θ₀ = 47°) |
| θ₀ | `arcsin(K·Vmax / (mglR))` | eq 10 |

**Why the deviations:** paper Table III system-ID gives J = 0.2004 (43× too big
for the real light CAD rig) and K = 1.1112 (electrical damping K²/R = 0.52 ≫
critical 0.067 → overdamped dead creep, no pumping). CAD supplies the true
J/m/l; the viz profile (K=0.06, b=0.003, Vmax=7) reproduces the paper's
multi-swing energy pump + PD catch ~6.4 s + settle to 0°. Open-loop upright
poles of the CAD plant: +6.87, −2.45, −7.47 (the +6.87 RHP pole = the unstable
equilibrium the controller stabilises).

Integrator: 3-state RK4 (θ, ω, i), dt = 1 ms, substepped per real Δt.

## Axis conventions

Blender Z-up → GLB Y-up after export:
- Blender +X → three +X
- Blender +Y → three -Z (Y-up swap)
- Blender +Z → three +Y

Swing axis (motor-encoder shaft): Blender +Y → three -Z.
Pivot world position (three): `(-0.20, 1.48, 0.07)` — encoder coupler center.

`baseQuat` rotates GLB-authored bob direction `+X` → upright `+Y` so θ=0
visually means "upright" (per paper convention).

## Camera

One camera for all modes = the Blender hero camera mapped through the
similarity transform: Blender world `(4.17, 4.62, 3.55)`, lens 40 / sensor 36
→ web `(3.97, 3.25, -5.35)`. Look point `(0.28, 0.80, -0.01)` = closest
approach of the Blender view ray to the pivot, raised +0.16 (≈1.3° pitch) so
the balanced upright bob keeps headroom on short viewports.

FOV contain-fits the authored 16:9 frame (`blenderVFov()`): narrower screens
keep the full 48.46° HFOV, wider screens keep the 16:9 VFOV, ×1.06 safety
matte — the Blender composition is never cropped, only matted. To re-pull
after moving the Blender camera: read `Camera.location` + forward, apply
`web = (Bx−0.2, Bz−0.297, −By−0.733)`, direction `(dx, dz, −dy)`.

## Modes

- **KIT** — auto-cycles part highlights (Arduino, motor, encoder,
  breadboard, rod+bob, stands, PSU). Callout (LEFT-docked, mirrors studio
  panels) shows part name + spec. partLabels keys MUST use GLTF-sanitized
  names (spaces→underscores): `Motor_-_RS-775`, `Encoder_v005` — literal
  Blender names with spaces never match.
- **RUN** — orbit + drag, Space perturbs, R resets, S toggles destabilizer.
  Default ω=0.001 at θ=π so destabilizer pumps energy to crest.
- **STUDIO** — three sub-panels: Diagram (block diagram), Plots
  (live θ/τ/i traces + open-loop pole-zero map + KPIs), Math (paper eqs +
  gains + poles).

Tweaks panel OPENS BY DEFAULT on desktop entry (>720px); mobile keeps it
behind the `[ T ] TWEAKS` FAB (positioned below the KIT callout zone).
Share-frame FAB is desktop-only (hidden under 720px).

Accent swatches are SITE-WIDE: `setAccent()` sets `--accent/-dim/-ink`
(non-default swatches keep hue/sat, re-seat lightness at L23/L16/L44/L30;
the default `#D4FF3A` swatch restores the authored palette EXACTLY via
`ACCENT_PRESETS`) and repaints 3D glow + rim, gizmo PD tint, θ plot trace,
RHP pole marks, and the share-frame serif (all read `ACCENT` per frame).
Choice persists in `localStorage['pendulum.accent']` and restores on boot.

Keys: `1/2/3` modes, `D/P/M` sub-panels, `R` reset, `Space` perturb,
`T` / `?` / `/` toggle tweaks, `Esc` → KIT. All hotkeys ignore events from
focused form controls (tweaks sliders/select).

## Performance

- GLB load: ~10.6 MB Draco, decoder from gstatic CDN.
- GLB URL uses a STATIC `?v=N` (bump manually on re-export). The old
  per-minute bust forced a fresh 10.6 MB download every minute in production.
- NO `<link rel=preload>` for the GLB (URL carries `?v=` → preload would
  never match and the GLB downloads twice).
- Importmap MUST come before any modulepreload tags (Chrome resolution order).
- `preserveDrawingBuffer: true` enables share-frame PNG capture.
- NaN guard in `physicsStep`: resets state on Inf/NaN to keep sim recoverable
  after long page-idle.
- Version query params: `styles.css?v=`, `app.js?v=`, GLB `?v=` — bump the
  matching one on every edit or browsers serve stale files (python http.server
  sends no Cache-Control).

## Re-exporting from Blender

When updating geometry, in Blender:

```python
# Reset mass empty rotation to baseline
bpy.data.objects['mass'].rotation_euler = (-1.5707963705062866, 0, 0)
bpy.context.view_layer.update()

# Select all mesh + empties
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects:
    if o.type in ('MESH','EMPTY'): o.select_set(True)

# Export with Draco + JPEG q80
bpy.ops.export_scene.gltf(
    filepath='.../site/assets/pendulum.glb',
    export_format='GLB', use_selection=True, export_yup=True,
    export_image_format='JPEG', export_jpeg_quality=80,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12,
)
```

After export, bump `GLB_URL`'s `?v=` in app.js so clients refetch.

## Mesh name patterns

GLTFLoader replaces SPACES in node names with UNDERSCORES. To match parts:

```js
const isMassPart = (name) =>
  /^(ct[ _].*coupler|mass_big_bolt|mass_small_bolt|mass_screw|swinging_support_rod)/i
    .test(name);
```

Tip probe: `/^mass_big_bolt_U/`.

## Dev server

```
cd .../inverted_pendulum/site
python3 -m http.server 8765
```

Open `http://localhost:8765/index.html`.
