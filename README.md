# Energy-Efficient Inverted Pendulum

[![Inverted pendulum lab](Control%20Theory%20Project/Blender/Website%20Project/claude_design/inverted_pendulum/site/assets/og.jpg)](https://inverted-pendulum-two.vercel.app)

**→ Live site: https://inverted-pendulum-two.vercel.app**

Interactive 3D lab site driven by real Blender geometry and paper-accurate physics
(Patel / Kurle / Golait / Kanwat, 2022 — see `Control Theory Project/Blender/Website Project/assets/CT_Project.pdf`).

The pendulum you see in the browser is not a baked animation — it is the same RK4
integrator and two-mode controller from `physics/pendulum_sim.py`, stepped live each
frame. Change `Kp`, `Kd`, or `Vmax` in the tweaks panel and the plant responds.

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

### Knowledge graph

The whole corpus — code, CAD, the paper PDF, lab photos, and Whisper transcripts of the
hardware videos — is indexed as a single navigable knowledge graph (416 nodes, 618 edges,
community-clustered).

| File | What |
|------|------|
| `Control Theory Project/graphify-out/graph.html` | Interactive graph — open in any browser, no server needed |
| `Control Theory Project/graphify-out/GRAPH_REPORT.md` | Audit report: communities, hub nodes, cross-document connections |

Every edge is tagged `EXTRACTED`, `INFERRED`, or `AMBIGUOUS`, so what was found in the
sources stays separable from what was inferred.

### Not in this repo (size limits)

Per-part GLB exports (`Control Theory Project/Blender/Website Project/assets/*.glb`, ~100 MB each) and `.obj` mesh
exports are gitignored — regenerate from `inverted_pendulum.blend` / the STEP sources.
The site's own Draco-compressed `pendulum.glb` (10.6 MB) **is** included.
