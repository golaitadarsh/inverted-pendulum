# College Projects

## Control Theory Project — Energy-Efficient Inverted Pendulum

Interactive 3D lab site driven by real Blender geometry and paper-accurate physics
(Patel / Kurle / Golait / Kanwat, 2022 — see `Blender/Website Project/assets/CT_Project.pdf`).

### Layout

| Path | What |
|------|------|
| `Control Theory Project/Blender/Website Project/claude_design/inverted_pendulum/site/` | **The website** — Three.js + live RK4 simulation, deployed on Vercel |
| `Control Theory Project/Blender/Website Project/physics/` | Authoritative physics: `pendulum_sim.py` (RK4 + swing-up + cascaded PD), `mass_properties.py` (CAD-derived inertia), `bake_pendulum.py` (Blender keyframe bake) |
| `Control Theory Project/Blender/inverted_pendulum.blend` | Blender source scene (rig, materials, camera, baked animation) |
| `Control Theory Project/assets/` | CAD sources — Fusion 360 (`.f3z`/`.f3d`), STEP, FreeCAD |
| `Control Theory Project/Inverted Pendulum/` | Real hardware photos/videos + project report PDF |

### Run the site locally

```sh
cd "Control Theory Project/Blender/Website Project/claude_design/inverted_pendulum/site"
python3 serve.py   # or: python3 -m http.server 8765
```

### Physics summary

Plant: `J θ̈ + b θ̇ = K i + m g l sin θ`, `L i̇ + i R = V − K θ̇` (θ = 0 upright).
Two-mode controller: energy-pump swing-up (`V = Vmax · sign(θ̇)`) until the energy
target, then cascaded PD-position / P-current stabiliser (Kp = 196, Kd = 28, Kp_i = 446).
Inertia from CAD, not system ID: `J = 0.00467 kg·m²`, `mgl = 0.244 N·m`.

### Not in this repo (size limits)

Per-part GLB exports (`Website Project/assets/*.glb`, ~100 MB each) and `.obj` mesh
exports are gitignored — regenerate from `inverted_pendulum.blend` / the STEP sources.
The site's own Draco-compressed `pendulum.glb` (10.6 MB) **is** included.
