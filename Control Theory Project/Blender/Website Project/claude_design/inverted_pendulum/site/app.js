import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ── Physics — Per CT_Project paper (Patel, Kurle, Golait, Kanwat 2022) ─────
// Plant:    J θ̈ + b θ̇ = K·i + m·g·l·sin(θ)
// Motor:    L (di/dt) + i·R = V − K·θ̇
// Destabilizer: V = Vmax · sgn(θ̇)   for |θ| ≥ θ0
// Stabiliser:   PD on position, with feedforward + current loop
//   id = (J/K) θ̈c + (b/K) θ̇ + (mgl sin θ)/K,   θ̈c = −Kp θ − Kd θ̇
//   V  = L i̇c + i·R + K θ̇,                     i̇c = Kp,i (id − i)
// Energy switch: pump until T ≥ Tt where T = -mgl(1-cos θ) + ½Jθ̇²
// MIRRORS physics/pendulum_sim.py PARAMS — keep the two in sync (single source).
// Motor electricals (R, L) + controller gains are verbatim from the paper.
// Mechanical plant (J, m, l) is from the CAD parts (physics/mass_properties.py):
// the paper's system-ID J=0.2004 was 43× too large for the real light rig.
// Motor K + damping b + Vmax use a documented "visualisation profile": the
// paper's K=1.1112 gives electrical damping K²/R=0.52 (critical 0.067) → the
// rig overdamps to a dead creep with no pumping. K=0.06 reproduces the paper's
// multi-swing energy pump + PD catch (matches the experimental video).
const PHYS = {
  // --- exact from paper (§III / §IV / §V) ---
  R: 2.3634,   // Ω    motor resistance
  L: 0.9794,   // H    motor inductance
  Kp: 196,     //      PD position proportional
  Kd: 28,      //      PD position derivative
  Kp_i: 446,   //      P current
  g: 9.81,
  // --- mechanical plant from CAD (mass_properties.py) ---
  J: 0.00467,  // kg·m²  inertia about shaft axis (CAD, overrides paper 0.2004)
  m: 0.1501,   // kg     swing-assembly mass (CAD)
  l: 0.1655,   // m      COM lever arm (CAD) → mgl = 0.2438 N·m
  // --- visualisation profile (see header) ---
  K: 0.06,     // V·s    torque/back-emf (paper 1.1112 over-damps)
  b: 0.003,    // N·m·s  bearing+air damping (paper 2.9630 non-physical here)
  Vmax: 7.0,   // V      voltage cap → θ0 = 47°
};
// Derived: limiting angle θ0 = arcsin(K·Vmax / (m·g·l·R))
PHYS.theta0 = Math.asin(Math.min(1, (PHYS.K * PHYS.Vmax) / (PHYS.m * PHYS.g * PHYS.l * PHYS.R)));
PHYS.Tt = -PHYS.m * PHYS.g * PHYS.l * (1 - Math.cos(PHYS.theta0 / 2));

const wrap = a => { let x = a; while (x > Math.PI) x -= 2*Math.PI; while (x <= -Math.PI) x += 2*Math.PI; return x; };

function controlVoltage(state, p, mode) {
  if (mode === 'off') return { V: 0, i_ref: 0, region: 'off' };
  const theta = wrap(state.theta), omega = state.omega, i = state.i;
  // Energy of pendulum (θ=0 reference at upright)
  const T = -p.m * p.g * p.l * (1 - Math.cos(theta)) + 0.5 * p.J * omega * omega;
  let V = 0, i_ref = i, region = 'idle';

  if (Math.abs(theta) < p.theta0) {
    // Stabilising cascade: PD position → desired current → P current → V
    const theta_ddot_c = -p.Kp * theta - p.Kd * omega;
    i_ref = (p.J / p.K) * theta_ddot_c + (p.b / p.K) * omega + (p.m * p.g * p.l * Math.sin(theta)) / p.K;
    const i_dot_c = p.Kp_i * (i_ref - i);
    V = p.L * i_dot_c + i * p.R + p.K * omega;
    region = 'pd';
  } else if (mode === 'swing') {
    // Destabilising bang-bang with energy switch
    if (T < p.Tt) {
      V = (omega >= 0 ? 1 : -1) * p.Vmax;
    } else {
      V = 0;
    }
    region = 'swingup';
  }

  // Voltage saturation
  V = Math.max(-p.Vmax, Math.min(p.Vmax, V));
  return { V, i_ref, region };
}

function rhs(s, V, p) {
  // dθ/dt = ω
  // dω/dt = (K·i + m·g·l·sin θ − b·ω) / J
  // di/dt = (V − i·R − K·ω) / L
  const dtheta = s.omega;
  const domega = (p.K * s.i + p.m * p.g * p.l * Math.sin(s.theta) - p.b * s.omega) / p.J;
  const di     = (V - s.i * p.R - p.K * s.omega) / p.L;
  return { dtheta, domega, di };
}
function rk4(state, dt, p, mode) {
  const { V, i_ref, region } = controlVoltage(state, p, mode);
  // 3-state RK4: θ, ω, i
  const k1 = rhs(state, V, p);
  const s2 = { theta: state.theta + 0.5*dt*k1.dtheta, omega: state.omega + 0.5*dt*k1.domega, i: state.i + 0.5*dt*k1.di };
  const k2 = rhs(s2, V, p);
  const s3 = { theta: state.theta + 0.5*dt*k2.dtheta, omega: state.omega + 0.5*dt*k2.domega, i: state.i + 0.5*dt*k2.di };
  const k3 = rhs(s3, V, p);
  const s4 = { theta: state.theta + dt*k3.dtheta,     omega: state.omega + dt*k3.domega,     i: state.i + dt*k3.di };
  const k4 = rhs(s4, V, p);
  // Motor torque for HUD (tau = K·i)
  const tau = p.K * state.i;
  return {
    theta: state.theta + dt*(k1.dtheta + 2*k2.dtheta + 2*k3.dtheta + k4.dtheta)/6,
    omega: state.omega + dt*(k1.domega + 2*k2.domega + 2*k3.domega + k4.domega)/6,
    i:     state.i     + dt*(k1.di     + 2*k2.di     + 2*k3.di     + k4.di)/6,
    V, tau, region,
  };
}

// ── Renderer / scene ────────────────────────────────────────────────────────
const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0xF4F1EB, 1);
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xF4F1EB);
// No fog — clean bone bg lets cutting mat + rig pop

// Environment IBL for PBR look
const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = envTex;
scene.environmentIntensity = 1.05;  // tighter so metals + MDF carry their own shape

// Camera — EXACT Blender hero camera (3/4 high, rig on the mat), mapped from the
// Blender scene through the measured similarity transform:
//   web = (Bx-0.2, Bz-0.297, -By-0.733),  direction (dx,dz,-dy)
// Blender cam world (4.17,4.62,3.55), lens 40 → web (3.97,3.25,-5.35).
// Look point = closest approach of the Blender view ray to the pendulum pivot.
const camera = new THREE.PerspectiveCamera(31, window.innerWidth/window.innerHeight, 0.05, 80);
// Look point raised 0.16 above the Blender ray (≈1.3° pitch) so the balanced
// upright bob — the money pose — keeps headroom on short viewports.
camera.position.set(3.97, 3.25, -5.35);
camera.lookAt(0.28, 0.80, -0.01);

// Contain-fit Blender's authored 16:9 frame (lens 40mm / sensor 36mm landscape,
// HFOV 48.46°). Narrower screens keep the full HFOV (vertical grows); wider
// screens keep the 16:9 VFOV (horizontal grows) — the composition is never
// cropped, only matted.
const BLENDER_HFOV = 2 * Math.atan(36 / (2 * 40));   // 48.46 deg
const AUTHORED_ASPECT = 16 / 9;
const FRAME_MARGIN = 1.06;  // 6% matte so the rig never grazes the edge
const blenderVFov = () => THREE.MathUtils.radToDeg(
  2 * Math.atan(FRAME_MARGIN * Math.tan(BLENDER_HFOV / 2) / Math.min(camera.aspect, AUTHORED_ASPECT))
);
camera.fov = blenderVFov();
camera.updateProjectionMatrix();

// Controls (disabled by default in KIT, enabled in RUN/STUDIO)
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0.28, 0.80, -0.01);
controls.minDistance = 2.8;
controls.maxDistance = 12;
controls.maxPolarAngle = Math.PI * 0.56;
controls.enablePan = false;
controls.enabled = false;

// Lights — three-point studio: warm key from front-camera-side, cool fill,
// brighter cool rim carving silhouette off bone canvas.
const key = new THREE.DirectionalLight(0xFFE6BD, 2.6);
key.position.set(2.8, 4.4, 3.4);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 0.5; key.shadow.camera.far = 12;
key.shadow.camera.left = -3.2; key.shadow.camera.right = 3.2;
key.shadow.camera.top = 3.2; key.shadow.camera.bottom = -3.2;
key.shadow.bias = -0.00035;
key.shadow.radius = 6;
key.shadow.blurSamples = 16;
scene.add(key);

const fill = new THREE.DirectionalLight(0x9CB4D8, 0.55);
fill.position.set(-2.8, 1.6, 2.2);
scene.add(fill);

// Back rim — cool kicker carving silhouette away from bone canvas.
const back = new THREE.DirectionalLight(0xEDE6D8, 1.05);
back.position.set(-1.4, 3.0, -3.4);
scene.add(back);

const rim = new THREE.SpotLight(0xC8F230, 0, 8, Math.PI/4, 0.45, 1);
rim.position.set(0, 3.0, 2.5);
rim.target.position.set(0, 1.4, 0);
scene.add(rim); scene.add(rim.target);

const ambient = new THREE.HemisphereLight(0xFBF7EC, 0xA8A294, 0.55);
scene.add(ambient);

// Axis gizmo scene (corner overlay)
const gizmoScene = new THREE.Scene();
const gizmoCam = new THREE.OrthographicCamera(-1.2, 1.2, 1.2, -1.2, 0.1, 10);
gizmoCam.position.set(0, 0, 3);
function makeAxis(color, dir) {
  const mat = new THREE.LineBasicMaterial({ color, linewidth: 1 });
  const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), dir]);
  return new THREE.Line(geo, mat);
}
// Light theme: ink-on-bone tints + accent for the active θ axis
gizmoScene.add(makeAxis(0xC25530, new THREE.Vector3(1,0,0)));  // X warn (darker)
gizmoScene.add(makeAxis(0x6E8A18, new THREE.Vector3(0,1,0)));  // Y accent (deeper)
gizmoScene.add(makeAxis(0x4670B0, new THREE.Vector3(0,0,1)));  // Z fill-blue (deeper)

// Theta indicator dot in gizmo
const gizmoDotGeo = new THREE.SphereGeometry(0.06, 16, 16);
const gizmoDotMat = new THREE.MeshBasicMaterial({ color: 0x0A0A08 });
const gizmoDot = new THREE.Mesh(gizmoDotGeo, gizmoDotMat);
gizmoScene.add(gizmoDot);
// Gizmo arc (theta sweep)
const arcSeg = 64;
const arcGeo = new THREE.BufferGeometry();
const arcPos = new Float32Array((arcSeg+1) * 3);
arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPos, 3));
const arcMat = new THREE.LineBasicMaterial({ color: 0x6E8A18, transparent: true, opacity: 0.7 });
const arcLine = new THREE.Line(arcGeo, arcMat);
gizmoScene.add(arcLine);

// Rod-tip trail in main scene
const TRAIL_LEN = 64;
const trailPositions = new Float32Array(TRAIL_LEN * 3);
const trailColors = new Float32Array(TRAIL_LEN * 3);
const trailGeo = new THREE.BufferGeometry();
trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
const trailMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.92, linewidth: 2 });
const trailLine = new THREE.Line(trailGeo, trailMat);
trailLine.frustumCulled = false;
scene.add(trailLine);
let trailHead = 0;
let trailCount = 0;
let tipProbe = null;            // single source of truth: bob mesh
const tipScratch = new THREE.Vector3();
let lastTipX = 0, lastTipY = 0, lastTipZ = 0;
let lastTipValid = false;

function pushTrail(x, y, z) {
  // Detect teleport (perturb / reset) — clear trail so we don't get a chord
  // through the world after θ wraps or jumps.
  if (lastTipValid) {
    const dx = x - lastTipX, dy = y - lastTipY, dz = z - lastTipZ;
    if (dx*dx + dy*dy + dz*dz > 0.04) { // > ~20 cm in one frame
      trailHead = 0; trailCount = 0;
      trailGeo.setDrawRange(0, 0);
    }
  }
  lastTipX = x; lastTipY = y; lastTipZ = z; lastTipValid = true;

  const i = (trailHead % TRAIL_LEN) * 3;
  trailPositions[i] = x;
  trailPositions[i+1] = y;
  trailPositions[i+2] = z;
  trailHead++;
  if (trailCount < TRAIL_LEN) trailCount++;
  // Rebuild a contiguous strip ordered by age (oldest first)
  const positions = trailGeo.attributes.position.array;
  const colors = trailGeo.attributes.color.array;
  for (let k = 0; k < trailCount; k++) {
    const idx = (trailHead - trailCount + k + TRAIL_LEN) % TRAIL_LEN;
    positions[k*3]   = trailPositions[idx*3];
    positions[k*3+1] = trailPositions[idx*3+1];
    positions[k*3+2] = trailPositions[idx*3+2];
    const t = k / Math.max(1, trailCount-1);
    // Trail fades dark ink → tightened acid-green → ink, reads against bone bg.
    const w = 1 - Math.abs(t - 0.5) * 2;  // peak at mid-trail
    colors[k*3]   = 0.04 + 0.74 * w;
    colors[k*3+1] = 0.04 + 0.92 * w;
    colors[k*3+2] = 0.03 + 0.18 * w;
  }
  trailGeo.attributes.position.needsUpdate = true;
  trailGeo.attributes.color.needsUpdate = true;
  trailGeo.setDrawRange(0, trailCount);
}

// Ground — bone plane catches shadows just under the cutting mat.
// Larger than mat so shadows fall on it; the mat hides its center.
const groundGeo = new THREE.PlaneGeometry(20, 20);
const groundMat = new THREE.ShadowMaterial({ opacity: 0.34 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI/2;
ground.position.y = -0.275;
ground.receiveShadow = true;
scene.add(ground);

// ── Load GLB ────────────────────────────────────────────────────────────────
const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
draco.preload();  // warm WASM before GLB hits
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(draco);

// Static version — bump manually on GLB re-export. (A per-minute bust forced
// a fresh 10.6 MB download every minute; wrong trade for production.)
const GLB_URL = 'assets/pendulum.glb?v=5';

// ── Blender-faithful procedural grain ───────────────────────────────────────
// The GLB ships PolyHaven `metal_plate` textures, but the Blender scene has
// since moved to procedural materials (MDF color-ramp + galvanized steel).
// glTF can't export procedural nodes, so we rebuild them as small value-noise
// CanvasTextures spanning the same color-ramp stops measured in Blender.
function makeGrainTexture(rgb1, rgb2, contrast) {
  const S = 256, N = 24;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const img = g.createImageData(S, S);
  const grid = Float32Array.from({ length: (N + 1) * (N + 1) }, () => Math.random());
  const sm = t => t * t * (3 - 2 * t);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const gx = (x / S) * N, gy = (y / S) * N;
      const x0 = Math.floor(gx), y0 = Math.floor(gy);
      const fx = sm(gx - x0), fy = sm(gy - y0);
      const i00 = grid[y0 * (N + 1) + x0],     i10 = grid[y0 * (N + 1) + x0 + 1];
      const i01 = grid[(y0 + 1) * (N + 1) + x0], i11 = grid[(y0 + 1) * (N + 1) + x0 + 1];
      let n = (i00 * (1 - fx) + i10 * fx) * (1 - fy) + (i01 * (1 - fx) + i11 * fx) * fy;
      n = 0.5 + (n - 0.5) * contrast + (Math.random() - 0.5) * 0.05;  // fleck grain
      const k = Math.min(1, Math.max(0, n));
      const o = (y * S + x) * 4;
      img.data[o]     = rgb1[0] + (rgb2[0] - rgb1[0]) * k;
      img.data[o + 1] = rgb1[1] + (rgb2[1] - rgb1[1]) * k;
      img.data[o + 2] = rgb1[2] + (rgb2[2] - rgb1[2]) * k;
      img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
// Blender MDF_Procedural ramp (0.55,0.40,0.25)→(0.78,0.60,0.40) linear ≈ these sRGB stops
const MDF_TEX = makeGrainTexture([196, 170, 137], [229, 203, 170], 0.65);
// Blender Steel_Galvanized ramp (0.55,0.56,0.58)→(0.78,0.79,0.80)
const STEEL_TEX = makeGrainTexture([196, 197, 200], [229, 230, 231], 0.5);

const loaderEl = document.getElementById('loader');
const loaderFill = document.getElementById('loader-bar-fill');
const loaderStatus = document.getElementById('loader-status');

function setStatus(text, pct) {
  loaderStatus.textContent = text;
  if (typeof pct === 'number') loaderFill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
}

setStatus('FETCH · GEOMETRY', 8);

// World objects we want to manipulate
let pendulumGroup = null;  // 'mass' empty (rotates with θ)
let massHighlightables = []; // bob meshes for emission pulse
let partRegistry = new Map(); // name → object (for KIT highlighting)
// Keys match GLTF-SANITIZED node names (GLTFLoader turns spaces into
// underscores): 'Motor - RS-775 v013' arrives as 'Motor_-_RS-775_v013_…'.
let partLabels = [
  { keys: ['arduino_uno'], label: 'ARDUINO UNO', sub: 'CONTROLLER · ATMEGA328P · 16 MHZ', n: '01' },
  { keys: ['Motor_-_RS-775'], label: 'BRUSHED DC MOTOR', sub: 'RS-775 · 12 V · 8 N·CM', n: '02' },
  { keys: ['Encoder_v005'], label: 'OPTICAL ENCODER', sub: '600 PPR · QUADRATURE', n: '03' },
  { keys: ['Breadboard'], label: 'BREADBOARD', sub: 'L298N DRIVER · POWER BUS', n: '04' },
  { keys: ['swinging_support_rod', 'mass_screw', 'mass_big_bolt', 'mass_small_bolt', 'ct_encoder_coupler', 'ct_motor_coupler'], label: 'ROD + BOB', sub: 'L = 0.17 M · M = 0.15 KG', n: '05' },
  { keys: ['motor_stand', 'encoder_stand', 'base_'], label: 'CHASSIS · STANDS', sub: 'ALUMINIUM PROFILE · 20×20 MM', n: '06' },
  { keys: ['12V_10A'], label: '12 V · 10 A SUPPLY', sub: 'BENCH PSU · ISOLATED', n: '07' },
];

gltfLoader.load(
  GLB_URL,
  (gltf) => {
    setStatus('PARSE · MATERIALS', 72);
    const root = gltf.scene;
    root.position.set(0, 0, 0);
    root.updateMatrixWorld(true);

    // Tag meshes + materials. GLTFLoader replaces spaces with underscores in
    // node names, so we match by pattern instead of literal set.
    const isMassPart = (name) => /^(ct[ _].*coupler|mass_big_bolt|mass_small_bolt|mass_screw|swinging_support_rod)/i.test(name);
    const massMeshes = [];
    root.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        if (obj.material && obj.material.isMeshStandardMaterial) {
          obj.material = obj.material.clone();
          obj.material.envMapIntensity = 0.85;
          // Blender-faithful materials. GLB material → Blender scene truth:
          //   metal_plate / mat.base_*  → MDF_Procedural (warm tan, matte)
          //   metal_plate_02 on rod+couplers → Aluminum_Brushed
          //   metal_plate_02 on mass bolts/screw → Steel_Galvanized
          // Everything else (motor, PCB, PSU, breadboard, encoder, cutting
          // mat) already carries the right flat factors from export.
          const mn = obj.material.name;
          const isBolt = /mass_big_bolt|mass_small_bolt|mass_screw/i.test(obj.name);
          if (mn === 'metal_plate' || mn === 'mat.base_bottom' || mn === 'mat.base_top') {
            obj.material.color.setHex(0xFFFFFF);
            obj.material.map = MDF_TEX;
            obj.material.metalness = 0.0;
            obj.material.roughness = 0.85;
            obj.material.envMapIntensity = 0.6;
          } else if (mn === 'metal_plate_02' && isBolt) {
            obj.material.color.setHex(0xFFFFFF);
            obj.material.map = STEEL_TEX;
            obj.material.metalness = 1.0;
            obj.material.roughness = 0.5;
            obj.material.envMapIntensity = 1.25;  // dull metal needs help in realtime
          } else if (mn === 'metal_plate_02') {  // rod + couplers
            obj.material.color.setHex(0xDDDDDF);
            obj.material.map = null;
            obj.material.metalness = 1.0;
            obj.material.roughness = 0.35;
          }
          obj.material.userData.baseColor = obj.material.color.clone();
          if (!obj.material.emissive) obj.material.emissive = new THREE.Color(0x000000);
          obj.material.userData.baseEmissive = obj.material.emissive.clone();
        }
        partRegistry.set(obj.name, obj);
        if (isMassPart(obj.name)) massMeshes.push(obj);
      }
    });

    root.traverse(obj => {
      if (obj.isMesh && /mass_big_bolt|mass_small_bolt|mass_screw/.test(obj.name)) {
        massHighlightables.push(obj);
        obj.material.emissive = new THREE.Color(accentHex);
        obj.material.emissiveIntensity = 0;
        obj.material.userData.idleEmission = 0;
      }
      if (/^mass_big_bolt_U/.test(obj.name)) tipProbe = obj;
    });

    scene.add(root);

    // ── Build a clean rotation pivot ────────────────────────────────────
    // Find the encoder shaft world position (use mid of encoder coupler).
    // GLTFLoader sanitizes node names (spaces → underscores), so match by
    // pattern — a literal-name get() can never hit.
    const couplerKey = Array.from(partRegistry.keys()).find(k => /^ct[ _]encoder[ _]coupler/i.test(k));
    const couplerMesh = couplerKey ? partRegistry.get(couplerKey) : null;
    let pivotPos = new THREE.Vector3(-0.20, 1.48, 0.07);
    if (couplerMesh) {
      const box = new THREE.Box3().setFromObject(couplerMesh);
      box.getCenter(pivotPos);
    }

    root.updateMatrixWorld(true);

    // Build pivot group at pivot world pos. Reparent mass meshes.
    pendulumGroup = new THREE.Group();
    pendulumGroup.name = '_pendulum_pivot';
    pendulumGroup.position.copy(pivotPos);
    scene.add(pendulumGroup);
    pendulumGroup.updateMatrixWorld(true);
    for (const m of massMeshes) {
      pendulumGroup.attach(m);  // preserves world transform
    }
    // Pendulum kinematics in three-space (Y-up).
    //   • Swing axis: along the encoder/motor shaft = Blender +Y = three -Z.
    //   • At runtime the bob (offset perpendicular to the shaft) traces a
    //     circle in the world XY plane.
    //   • In the GLB-authored pose the bob is offset along +X (sideways).
    //     We treat that sideways pose as θ=+π/2. So `baseQuat` needs to
    //     rotate -π/2 around the swing axis to bring the bob UP for θ=0.
    // World "upright" target direction = +Y
    const uprightDir = new THREE.Vector3(0, 1, 0);
    // The GLB has bob authored at +X offset (sideways from swing axis -Z).
    // To express that pose as θ=0 means: identity baseQuat puts bob at +X.
    // We want θ=0 = upright (+Y), so baseQuat rotates +X → +Y about swingAxis
    // (-Z). That's -π/2 around -Z = +π/2 around +Z. Use general unit-vector
    // mapping for correctness.
    pendulumGroup.userData.baseQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(1, 0, 0),
      uprightDir
    );
    // Axis of swing = X (perpendicular to upright + initial rest, which both
    // lie in the YZ plane after our base rotation).
    // Swing axis: Blender +Y → Three -Z. The pendulum rotates around the
    // encoder/motor shaft, which lies along Y in Blender's frame.
    pendulumGroup.userData.swingAxis = new THREE.Vector3(0, 0, -1);

    // ── Re-seat the cutting mat to Blender truth ────────────────────────
    // The mat was composed into the GLB before the .blend's final layout:
    // it ships 5.45 m wide, off-center, with the rig feet 0.30 BELOW its
    // top surface (rig sunk through it). Blender truth: 11.044 m wide,
    // concentric with the base (mat center 35 mm behind base center in web
    // -z), top surface flush under the base-divider feet.
    const matObj = partRegistry.get('Object_2');
    if (matObj) {
      const feet = new THREE.Box3();
      const baseBox = new THREE.Box3();
      partRegistry.forEach((o, n) => {
        if (/^base_divider/.test(n)) feet.expandByObject(o);
        if (/^base_bottom/.test(n)) baseBox.expandByObject(o);
      });
      if (!feet.isEmpty() && !baseBox.isEmpty()) {
        const wrap = new THREE.Group();
        wrap.name = '_mat_reseat';
        scene.add(wrap);
        wrap.attach(matObj);  // preserves current world transform
        const mb = new THREE.Box3().setFromObject(matObj);
        const s = 11.044 / (mb.max.x - mb.min.x);   // Blender mat width
        wrap.scale.set(s, 1, s);   // world-axis scale: plane grows, thickness doesn't
        wrap.updateMatrixWorld(true);
        const mb2 = new THREE.Box3().setFromObject(matObj);
        const mc = mb2.getCenter(new THREE.Vector3());
        const bc = baseBox.getCenter(new THREE.Vector3());
        wrap.position.x += bc.x - mc.x;
        wrap.position.z += (bc.z - 0.035) - mc.z;
        wrap.position.y += feet.min.y - mb2.max.y;
        wrap.updateMatrixWorld(true);
        // Shadow-catcher ground tucks just under the re-seated mat.
        const mb3 = new THREE.Box3().setFromObject(matObj);
        ground.position.y = mb3.min.y - 0.002;
      }
    }

    setStatus('CALIBRATE · CAMERA', 92);
    setTimeout(() => {
      setStatus('READY · CLICK [ ENTER LAB ]', 100);
      setTimeout(() => { loaderEl.classList.add('gone'); startLoop(); }, 360);
    }, 220);
  },
  (xhr) => {
    if (xhr.total > 0) {
      const pct = 8 + (xhr.loaded / xhr.total) * 70;
      setStatus(`FETCH · GEOMETRY · ${(xhr.loaded/1024/1024).toFixed(1)} MB`, pct);
    }
  },
  (err) => { console.error('GLB load error', err); setStatus('ERROR · CHECK CONSOLE', 100); }
);

// ── Sim state ──────────────────────────────────────────────────────────────
const sim = {
  // Hanging down at rest. Destabiliser pumps energy → swing-up → PD catch.
  state: { theta: Math.PI, omega: 0.001, i: 0 },
  mode: 'swing',
  t: 0,
  lastTau: 0,
  lastV: 0,
  lastRegion: 'idle',
  history: [],
};
const dt = 0.001;
window.__sim = sim; window.__PHYS = PHYS; window.__parts = partRegistry;

// Fractional-substep accumulator: rounding realDt to whole substeps ran the
// sim ~2% fast at 60 Hz (17 × 1 ms per 16.7 ms frame). Carry the remainder.
let simAccum = 0;

function physicsStep(realDt) {
  // Guard: clamp realDt to avoid integrator blowup after long page idle
  if (!isFinite(realDt) || realDt < 0) realDt = 0.016;
  simAccum += Math.min(realDt, 0.05);
  const n = Math.floor(simAccum / dt);
  simAccum -= n * dt;
  for (let k = 0; k < n; k++) {
    const r = rk4(sim.state, dt, PHYS, sim.mode);
    if (!isFinite(r.theta) || !isFinite(r.omega) || !isFinite(r.i)) {
      // Reset on NaN/Inf — keep sim recoverable
      sim.state = { theta: Math.PI, omega: 0.001, i: 0 };
      sim.lastTau = 0; sim.lastV = 0; sim.lastRegion = 'idle';
      sim.t += dt;
      continue;
    }
    sim.state = { theta: r.theta, omega: r.omega, i: r.i };
    sim.lastTau = r.tau;
    sim.lastV   = r.V;
    sim.lastRegion = r.region;
    sim.t += dt;
  }
  sim.history.push({ t: sim.t, theta: wrap(sim.state.theta), omega: sim.state.omega, tau: sim.lastTau, i: sim.state.i });
  const cutoff = sim.t - 6;
  while (sim.history.length && sim.history[0].t < cutoff) sim.history.shift();
}

// ── UI mode handling ────────────────────────────────────────────────────────
const uiState = {
  mode: 'kit',     // kit | run | studio
  sub: 'diagram',  // diagram | plots | math
  kitIdx: 0,
  kitTimer: 0,
  kitApplied: false,  // highlight painted for the current KIT entry
};

const pillEls = document.querySelectorAll('#pills .pill');
const subPillEls = document.querySelectorAll('#sub-pills .pill');
const subPillsContainer = document.getElementById('sub-pills');
const panels = {
  diagram: document.getElementById('panel-diagram'),
  plots:   document.getElementById('panel-plots'),
  math:    document.getElementById('panel-math'),
  docs:    document.getElementById('panel-docs'),
};
const kitCallout = document.getElementById('kit-callout');
const bNum = document.getElementById('b-num');
const bLabel = document.getElementById('b-label');
const bHint = document.getElementById('b-hint');

function setMode(m) {
  uiState.mode = m;
  pillEls.forEach(p => p.classList.toggle('active', p.dataset.mode === m));
  if (m === 'kit')    { bNum.textContent = '[ 01 ]'; bLabel.textContent = 'KIT.'; bHint.textContent = '[ 1 KIT ]   [ 2 RUN ]   [ 3 STUDIO ]   [ T TWEAKS ]'; }
  if (m === 'run')    { bNum.textContent = '[ 02 ]'; bLabel.textContent = 'RUN.'; bHint.textContent = '[ DRAG ORBIT ]   [ SPACE PERTURB ]   [ R RESET ]   [ T TWEAKS ]'; }
  if (m === 'studio') { bNum.textContent = '[ 03 ]'; bLabel.textContent = 'STUDIO.'; bHint.textContent = '[ D DIAGRAM ]   [ P PLOTS ]   [ M MATH ]   [ A ARCHIVE ]   [ ESC ]'; }

  controls.enabled = (m !== 'kit');

  // Reset highlight (also restores baseColor)
  clearKitHighlight();
  uiState.kitTimer = 0;
  uiState.kitApplied = false;

  // Sub-pills + panels
  subPillsContainer.classList.toggle('hidden', m !== 'studio');
  ['diagram','plots','math','docs'].forEach(k => {
    const visible = (m === 'studio' && uiState.sub === k);
    panels[k].classList.toggle('hidden', !visible);
    requestAnimationFrame(() => panels[k].classList.toggle('visible', visible));
  });

  // Camera per mode — the one Blender hero camera (see top-of-file mapping).
  // fov tracks Blender's horizontal fov for the live aspect.
  const BCAM = { pos: new THREE.Vector3(3.97, 3.25, -5.35), look: new THREE.Vector3(0.28, 0.80, -0.01) };
  const fov = blenderVFov();
  const targets = {
    kit:    { pos: BCAM.pos.clone(), look: BCAM.look.clone(), fov },
    run:    { pos: BCAM.pos.clone(), look: BCAM.look.clone(), fov },
    studio: { pos: BCAM.pos.clone(), look: BCAM.look.clone(), fov },
  };
  camAnim = { ...targets[m], t: 0, dur: 0.85, fromPos: camera.position.clone(), fromTarget: controls.target.clone(), fromFov: camera.fov };
}
function setSub(s) {
  uiState.sub = s;
  subPillEls.forEach(p => p.classList.toggle('active', p.dataset.sub === s));
  ['diagram','plots','math','docs'].forEach(k => {
    const visible = (uiState.mode === 'studio' && uiState.sub === k);
    panels[k].classList.toggle('hidden', !visible);
    requestAnimationFrame(() => panels[k].classList.toggle('visible', visible));
  });
}

pillEls.forEach(p => p.addEventListener('click', (e) => { setMode(p.dataset.mode); e.currentTarget.blur(); }));
subPillEls.forEach(p => p.addEventListener('click', (e) => { setSub(p.dataset.sub); e.currentTarget.blur(); }));
// Blur any focused interactive on Space so it doesn't double-trigger
window.addEventListener('keydown', (e) => {
  if (e.key === ' ' && document.activeElement && document.activeElement.blur) {
    document.activeElement.blur();
  }
}, true);

window.addEventListener('keydown', (e) => {
  // Don't hijack keys while a form control (tweaks sliders/select) has focus
  if (e.target && e.target.closest && e.target.closest('input, select, textarea')) return;
  if (e.key === '1') setMode('kit');
  else if (e.key === '2') setMode('run');
  else if (e.key === '3') setMode('studio');
  else if (e.key === 'd' || e.key === 'D') { if (uiState.mode==='studio') setSub('diagram'); }
  else if (e.key === 'p' || e.key === 'P') { if (uiState.mode==='studio') setSub('plots'); }
  else if (e.key === 'm' || e.key === 'M') { if (uiState.mode==='studio') setSub('math'); }
  else if (e.key === 'a' || e.key === 'A') { if (uiState.mode==='studio') setSub('docs'); }
  else if (e.key === 'r' || e.key === 'R') resetSim();
  else if (e.key === ' ') { e.preventDefault(); sim.state.omega += (Math.random() > 0.5 ? 1 : -1) * 1.3; pulseBob(); }
  else if (e.key === 's' || e.key === 'S') { sim.mode = (sim.mode === 'swing') ? 'off' : 'swing'; }
  else if (e.key === 'Escape') setMode('kit');
});

// Bob pulse on PD catch or perturb
let pulseT = 0;
function pulseBob() { pulseT = 1.0; }

// ── KIT highlight cycle ────────────────────────────────────────────────────
// Per-mesh emission factor — metals overdrive less than plastics/PCBs.
function emissionFactor(meshName) {
  const n = (meshName || '').toLowerCase();
  if (n.includes('mass_big_bolt') || n.includes('mass_small_bolt') || n.includes('coupler')) return 0.10;
  if (n.includes('mass_screw') || n.includes('swinging_support_rod'))                       return 0.14;
  if (n.includes('rs-775') || n.includes('stand'))                                          return 0.18;
  return 0.24;
}

// Current accent (swatch-selectable) — SITE-WIDE. setAccent() drives the CSS
// vars (--accent/-dim/-ink → FAB, pills, KPIs, hero serif, sliders), the 3D
// glow (KIT highlight, bob pulse, rim light), the gizmo PD-region tint, the
// θ plot trace, the RHP pole marks, and the share-frame serif. The default
// swatch restores the AUTHORED palette exactly; other swatches keep their
// hue/sat and re-seat lightness on the authored ladder (dim L23 for text and
// borders on bone, ink L16, mid L44, gizmo L30) so contrast stays readable.
const ACCENT_PRESETS = {
  '#D4FF3A': { dim: '#4F6E08', ink: '#364B05', mid: '#9BBF1F', giz: 0x6E8A18 },
};
let ACCENT = { raw: '#D4FF3A', ...ACCENT_PRESETS['#D4FF3A'] };
let accentHex = 0xD4FF3A;

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function setAccent(raw) {
  const preset = ACCENT_PRESETS[raw];
  if (preset) {
    ACCENT = { raw, ...preset };
  } else {
    const r = parseInt(raw.slice(1, 3), 16) / 255;
    const g = parseInt(raw.slice(3, 5), 16) / 255;
    const b = parseInt(raw.slice(5, 7), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d > 0) {
      if (mx === r) h = 60 * (((g - b) / d) % 6);
      else if (mx === g) h = 60 * ((b - r) / d + 2);
      else h = 60 * ((r - g) / d + 4);
    }
    if (h < 0) h += 360;
    const l = (mx + mn) / 2;
    const s = d === 0 ? 0 : (d / (1 - Math.abs(2 * l - 1))) * 100;
    ACCENT = {
      raw,
      dim: hslToHex(h, s, 23),
      ink: hslToHex(h, s, 16),
      mid: hslToHex(h, s, 44),
      giz: parseInt(hslToHex(h, s, 30).slice(1), 16),
    };
  }
  accentHex = parseInt(ACCENT.raw.slice(1), 16);
  const rs = document.documentElement.style;
  rs.setProperty('--accent', ACCENT.raw);
  rs.setProperty('--accent-dim', ACCENT.dim);
  rs.setProperty('--accent-ink', ACCENT.ink);
}

function applyKitHighlight() {
  const entry = partLabels[uiState.kitIdx];
  if (!entry) return;
  let any = false;
  partRegistry.forEach((obj, name) => {
    if (name === 'Object_2') return;  // cutting mat = context, never dim
    const isMatch = entry.keys.some(k => name.includes(k));
    const m = obj.material;
    if (!m) return;
    if (!m.emissive) m.emissive = new THREE.Color(accentHex);
    if (isMatch) {
      m.emissive.set(accentHex);
      m.emissiveIntensity = emissionFactor(name);
      m.color.copy(m.userData.baseColor);
      any = true;
    } else {
      m.emissiveIntensity = 0;
      // Dim, don't crush — 0.45 keeps the MDF warm + materials readable.
      m.color.copy(m.userData.baseColor).multiplyScalar(0.45);
    }
  });
  document.getElementById('kit-num').textContent = `[ ${entry.n} ]`;
  document.getElementById('kit-name').textContent = entry.label;
  document.getElementById('kit-sub').textContent = entry.sub;
  if (any) { kitCallout.classList.remove('hidden'); kitCallout.classList.add('visible'); }
}

function clearKitHighlight() {
  partRegistry.forEach((obj) => {
    const m = obj.material;
    if (!m) return;
    // Restore idle emission (e.g. bob keeps a small glow)
    m.emissiveIntensity = m.userData.idleEmission || 0;
    if (m.userData.baseColor) m.color.copy(m.userData.baseColor);
  });
  kitCallout.classList.add('hidden'); kitCallout.classList.remove('visible');
}

// ── Camera tween (smooth ease-out) ─────────────────────────────────────────
let camAnim = null;
const easeOut = t => 1 - Math.pow(1 - t, 3);
function stepCamAnim(realDt) {
  if (!camAnim) return;
  camAnim.t = Math.min(1, camAnim.t + realDt / camAnim.dur);
  const k = easeOut(camAnim.t);
  camera.position.lerpVectors(camAnim.fromPos, camAnim.pos, k);
  controls.target.lerpVectors(camAnim.fromTarget, camAnim.look, k);
  camera.fov = camAnim.fromFov + (camAnim.fov - camAnim.fromFov) * k;
  camera.updateProjectionMatrix();
  if (camAnim.t >= 1) camAnim = null;
}

// ── Plots (2D canvas) ──────────────────────────────────────────────────────
const plotTheta = document.getElementById('plot-theta');
const plotTau   = document.getElementById('plot-tau');
const plotPoles = document.getElementById('plot-poles');
const plotCurrent = document.getElementById('plot-current');
const plotPhase = document.getElementById('plot-phase');
const ctxT = plotTheta.getContext('2d');
const ctxU = plotTau.getContext('2d');
const ctxP = plotPoles ? plotPoles.getContext('2d') : null;
const ctxI = plotCurrent ? plotCurrent.getContext('2d') : null;
const ctxPh = plotPhase ? plotPhase.getContext('2d') : null;

function drawPhase(ctx, samples) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  const xMin = -Math.PI, xMax = Math.PI;   // θ
  const yMin = -16, yMax = 16;              // ω (swing-through peaks ~14 rad/s)
  const X = th => ((th - xMin) / (xMax - xMin)) * w;
  const Y = om => h - ((om - yMin) / (yMax - yMin)) * h;
  // Grid + zero axes
  ctx.strokeStyle = 'rgba(10,10,8,.08)'; ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(X(i * Math.PI/2), 0); ctx.lineTo(X(i * Math.PI/2), h); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(10,10,8,.32)';
  ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(w, Y(0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), h); ctx.stroke();
  // Trace
  if (samples.length < 2) return;
  ctx.lineWidth = 1.8;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i-1], b = samples[i];
    // Skip when wrapping past ±π
    if (Math.abs(b.theta - a.theta) > Math.PI) continue;
    const age = (samples.length - i) / samples.length;
    ctx.strokeStyle = `rgba(79,110,8,${1 - age * 0.8})`;
    ctx.beginPath();
    ctx.moveTo(X(a.theta), Y(a.omega));
    ctx.lineTo(X(b.theta), Y(b.omega));
    ctx.stroke();
  }
  // Current dot
  const last = samples[samples.length - 1];
  ctx.fillStyle = '#0A0A08';
  ctx.beginPath(); ctx.arc(X(last.theta), Y(last.omega), 3, 0, Math.PI*2); ctx.fill();
  // Labels
  ctx.fillStyle = 'rgba(10,10,8,.45)';
  ctx.font = '9px ui-monospace, Geist Mono, monospace';
  ctx.fillText('θ →', w - 24, Y(0) - 4);
  ctx.fillText('θ̇', X(0) + 4, 10);
  ctx.fillText('-π', X(-Math.PI) + 4, h - 4);
  ctx.fillText('+π', X(Math.PI) - 16, h - 4);
}

function drawPoleZero(ctx) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  // Real axis [-10, 10], Imag axis [-10, 10] (poles are real, but we keep an Im axis line)
  const xMin = -10, xMax = 10;
  const yMin = -10, yMax = 10;
  const X = re => ((re - xMin) / (xMax - xMin)) * w;
  const Y = im => h - ((im - yMin) / (yMax - yMin)) * h;
  // Grid
  ctx.strokeStyle = 'rgba(10,10,8,.08)';
  ctx.lineWidth = 1;
  for (let r = xMin; r <= xMax; r += 5) {
    const x = X(r);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  // Axes
  ctx.strokeStyle = 'rgba(10,10,8,.32)';
  ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(w, Y(0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), h); ctx.stroke();
  // Open-loop poles of the CAD plant linearised about UPRIGHT (θ=0).
  // The +6.87 pole is in the RHP → upright is the unstable equilibrium the
  // controller must stabilise.
  const poles = [6.87, -2.45, -7.47];
  for (const p of poles) {
    const cx = X(p), cy = Y(0);
    const inRHP = p > 0;
    ctx.strokeStyle = inRHP ? ACCENT.dim : '#0A0A08';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 6); ctx.lineTo(cx + 6, cy + 6);
    ctx.moveTo(cx + 6, cy - 6); ctx.lineTo(cx - 6, cy + 6);
    ctx.stroke();
    // Label
    ctx.fillStyle = inRHP ? ACCENT.dim : 'rgba(10,10,8,.62)';
    ctx.font = '10px ui-monospace, Geist Mono, monospace';
    ctx.fillText(p.toFixed(2), cx + 8, cy - 8);
  }
  // RHP shading hint
  ctx.fillStyle = 'rgba(255,106,61,.08)';
  ctx.fillRect(X(0), 0, w - X(0), h);
  ctx.fillStyle = 'rgba(10,10,8,.55)';
  ctx.font = '9px ui-monospace, Geist Mono, monospace';
  ctx.fillText('Re', w - 16, Y(0) - 4);
  ctx.fillText('Im', X(0) + 4, 10);
}

function drawPlot(ctx, samples, fieldKey, yMin, yMax, color, wrapGap = false) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  // grid — ink-on-bone (light theme), not the old dark-theme bone tints
  ctx.strokeStyle = 'rgba(10,10,8,.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = (i / 4) * h;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  // zero line
  const zy = h - ((0 - yMin) / (yMax - yMin)) * h;
  ctx.strokeStyle = 'rgba(10,10,8,.30)';
  ctx.beginPath(); ctx.moveTo(0, zy); ctx.lineTo(w, zy); ctx.stroke();

  if (!samples.length) return;
  const tNow = samples[samples.length-1].t;
  const tWindow = 6;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const x = ((s.t - (tNow - tWindow)) / tWindow) * w;
    const v = Math.max(yMin, Math.min(yMax, s[fieldKey]));
    const y = h - ((v - yMin) / (yMax - yMin)) * h;
    // wrapGap: lift the pen across ±π wrap discontinuities (θ trace)
    if (i === 0 || (wrapGap && Math.abs(s[fieldKey] - samples[i-1][fieldKey]) > Math.PI)) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// KPI tracking
let absThetaMax = 0, absTauMax = 0, catchT = null, settleTime = null;

function resetSim(theta = Math.PI) {
  sim.state = { theta, omega: 0.001, i: 0 };
  sim.history.length = 0;
  absThetaMax = 0; absTauMax = 0; catchT = null; settleTime = null;
}

function updateKPIs() {
  const th = Math.abs(wrap(sim.state.theta));
  const t  = Math.abs(sim.lastTau);
  if (th > absThetaMax) absThetaMax = th;
  if (t  > absTauMax)   absTauMax  = t;
  // SETTLE = time from PD catch until |θ| first drops under 0.05 rad,
  // then frozen (comparable to the 0.29 s design figure). Leaving the PD
  // region (perturb → swing-up) re-arms the measurement.
  if (sim.lastRegion === 'pd') {
    if (catchT === null) { catchT = sim.t; settleTime = null; }
    if (settleTime === null && th < 0.05) settleTime = sim.t - catchT;
  } else {
    catchT = null; settleTime = null;
  }
  document.getElementById('k-thmax').textContent = absThetaMax.toFixed(2);
  document.getElementById('k-tmax').textContent  = absTauMax.toFixed(2);
  document.getElementById('k-settle').textContent = (settleTime !== null) ? settleTime.toFixed(2) : '—';
  document.getElementById('k-region').textContent = sim.lastRegion.toUpperCase();
}

// ── Main loop ──────────────────────────────────────────────────────────────
let last = performance.now();
let fps = 60, fpsAccum = 0, fpsFrames = 0;

function frame(now) {
  const realDt = (now - last) / 1000;
  last = now;

  // FPS
  fpsAccum += realDt; fpsFrames++;
  if (fpsAccum >= 0.5) { fps = Math.round(fpsFrames / fpsAccum); fpsAccum = 0; fpsFrames = 0; }

  // Sim
  physicsStep(realDt);

  // Detect PD catch transition for bob pulse
  // (cheap: pulse when entering 'pd' region from elsewhere)
  if (!frame.prevRegion) frame.prevRegion = 'idle';
  if (heroDone && sim.lastRegion === 'pd' && frame.prevRegion !== 'pd') pulseBob();
  frame.prevRegion = sim.lastRegion;

  // Trail only after the hero leaves — it scribbles under the intro type.
  trailLine.visible = heroDone;

  // Pendulum visual rotation. mass empty exported at -π/2 around X (rod
  // horizontal). Rotate ON TOP so θ=0 = upright (+Y), θ=π = hanging (-Y).
  if (pendulumGroup && pendulumGroup.userData.baseQuat) {
    // Compose: base rotation (rest → upright) × additional θ swing around
    // the global X swing axis. θ=0 → upright (+Y). θ=π → hanging (-Y).
    const swingQ = new THREE.Quaternion().setFromAxisAngle(
      pendulumGroup.userData.swingAxis, wrap(sim.state.theta)
    );
    pendulumGroup.quaternion.copy(swingQ).multiply(pendulumGroup.userData.baseQuat);
    pendulumGroup.updateMatrixWorld();
    if (tipProbe) {
      tipProbe.getWorldPosition(tipScratch);
      pushTrail(tipScratch.x, tipScratch.y, tipScratch.z);
    }
  }

  // Bob pulse decay — flash emissive on perturb / PD catch, then restore the
  // mode's true baseline (KIT highlight or idle) so no glow gets stuck.
  if (pulseT > 0) {
    pulseT = Math.max(0, pulseT - realDt * 4.0);
    const e = pulseT * 0.9;
    massHighlightables.forEach(m => { if (m.material) m.material.emissiveIntensity = e; });
    rim.intensity = pulseT * 80;
    if (pulseT === 0) {
      rim.intensity = 0;
      if (uiState.mode === 'kit' && uiState.kitApplied) applyKitHighlight();
      else massHighlightables.forEach(m => {
        if (m.material) m.material.emissiveIntensity = m.material.userData.idleEmission ?? 0;
      });
    }
  }

  // KIT auto-cycle — only once the hero overlay is gone, so the intro shot
  // shows clean Blender materials (no dim, no accent glow).
  if (uiState.mode === 'kit' && heroDone) {
    if (!uiState.kitApplied) { uiState.kitApplied = true; applyKitHighlight(); }
    uiState.kitTimer += realDt;
    if (uiState.kitTimer >= 3.6) {
      uiState.kitTimer = 0;
      uiState.kitIdx = (uiState.kitIdx + 1) % partLabels.length;
      applyKitHighlight();
    }
  }

  // Cam anim
  stepCamAnim(realDt);

  // HUD readout
  document.getElementById('r-theta').textContent = wrap(sim.state.theta).toFixed(3);
  document.getElementById('r-omega').textContent = sim.state.omega.toFixed(2);
  document.getElementById('r-tau').textContent   = sim.lastTau.toFixed(2);
  document.getElementById('r-fps').textContent   = fps;

  // KPIs track continuously (catch/settle must not depend on the panel being
  // open); plots only redraw while visible.
  updateKPIs();
  if (uiState.mode === 'studio' && uiState.sub === 'plots') {
    drawPlot(ctxT, sim.history, 'theta', -Math.PI, Math.PI, ACCENT.dim, true);
    const tauMax = PHYS.K * (PHYS.Vmax / PHYS.R);
    drawPlot(ctxU, sim.history, 'tau', -tauMax, tauMax, '#0A0A08');
    if (ctxI) {
      const iMax = PHYS.Vmax / PHYS.R;
      drawPlot(ctxI, sim.history, 'i', -iMax, iMax, '#B83B14');
    }
    if (ctxP) drawPoleZero(ctxP);
    if (ctxPh) drawPhase(ctxPh, sim.history);
  }

  controls.update();
  renderer.render(scene, camera);

  // ── Gizmo overlay (bottom-right inset, mirrors θ) ──────────────────────
  if (!heroDone) { requestAnimationFrame(frame); return; }  // clean hero shot
  const gizmoSize = 120;
  // Rotate gizmo group to mirror camera orientation
  gizmoScene.quaternion.copy(camera.quaternion).invert();
  // Dot position from wrapped θ
  const theta = wrap(sim.state.theta);
  gizmoDot.position.set(Math.sin(theta), Math.cos(theta), 0);
  // Arc 0 → θ, sweep the short way (always between -π..π via wrap)
  const arcA = arcGeo.attributes.position.array;
  const steps = arcSeg;
  for (let k = 0; k <= steps; k++) {
    const t = (k / steps) * theta;
    arcA[k*3]   = 0.7 * Math.sin(t);
    arcA[k*3+1] = 0.7 * Math.cos(t);
    arcA[k*3+2] = 0;
  }
  arcGeo.attributes.position.needsUpdate = true;
  // Tint dot/arc by region — light-theme palette (deeper for readability)
  if (sim.lastRegion === 'pd') {
    gizmoDotMat.color.setHex(ACCENT.giz);
    arcMat.color.setHex(ACCENT.giz);
  } else if (sim.lastRegion === 'swingup') {
    gizmoDotMat.color.setHex(0xC25530);
    arcMat.color.setHex(0xC25530);
  } else {
    gizmoDotMat.color.setHex(0x0A0A08);
    arcMat.color.setHex(0x0A0A08);
  }

  // Gizmo sits in bottom-right above the help hint
  const gx = window.innerWidth - gizmoSize - 24;
  const gy = 80;
  renderer.setScissorTest(true);
  renderer.setScissor(gx, gy, gizmoSize, gizmoSize);
  renderer.setViewport(gx, gy, gizmoSize, gizmoSize);
  renderer.clearDepth();
  renderer.render(gizmoScene, gizmoCam);
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);

  requestAnimationFrame(frame);
}

function startLoop() {
  // Start sim immediately so the background shows live motion under hero.
  setMode('kit');
  last = performance.now();
  requestAnimationFrame(frame);
  showHero();
}

// ── Hero intro ─────────────────────────────────────────────────────────────
const heroEl = document.getElementById('hero');
const heroEnter = document.getElementById('hero-enter');
let heroDone = false;

function showHero() {
  heroEl.classList.remove('hidden');
  // Next frame so layout settles before animations fire.
  requestAnimationFrame(() => heroEl.classList.add('go'));
}
function dismissHero() {
  if (heroDone) return;
  heroDone = true;
  heroEl.classList.add('gone');
  document.body.classList.add('entered');
  setTimeout(() => heroEl.classList.add('hidden'), 280);
  setMode('run');
  // Tweaks panel rides along from the start on desktop — it's the lab bench,
  // not a hidden debug menu. Mobile keeps it folded behind the FAB.
  if (window.innerWidth > 720) openTweaks(true);
  // Also clear any stale trail so the first visible arc is clean
  trailHead = 0; trailCount = 0; trailGeo.setDrawRange(0, 0);
}

heroEnter.addEventListener('click', dismissHero);
window.addEventListener('keydown', (e) => {
  if (heroDone) return;
  if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === 'Enter' || e.key === ' ') {
    dismissHero();
    // Space/Enter only dismiss — don't fall through to the mode handler,
    // where Space would also fire a perturb kick on entry.
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); }
  }
}, true);

// ── Click on 3D to perturb (RUN mode) ──────────────────────────────────────
// Orbit drags also end in a `click` on the canvas — only treat it as a
// perturb tap when the pointer barely moved between down and up.
let pointerDownX = 0, pointerDownY = 0;
canvas.addEventListener('pointerdown', (e) => { pointerDownX = e.clientX; pointerDownY = e.clientY; });
canvas.addEventListener('click', (e) => {
  if (uiState.mode !== 'run') return;
  if (Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY) > 6) return;
  sim.state.omega += (e.clientX < window.innerWidth/2 ? -1 : 1) * 1.1;
  pulseBob();
});

// ── Share frame ────────────────────────────────────────────────────────────
// Renders a fresh frame at higher resolution, composites design chrome via
// canvas 2D, and triggers a PNG download. Useful for sharing as still hero.
function showToast(html, ms = 1800) {
  const t = document.getElementById('toast');
  t.innerHTML = html;
  t.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove('show'), ms);
}

document.getElementById('share-frame').addEventListener('click', (ev) => {
  const wantsClipboard = ev.shiftKey;
  const W = 1920, H = 1080;
  const prevSize = renderer.getSize(new THREE.Vector2());
  const prevPR = renderer.getPixelRatio();
  // Render scene into off-screen target
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  camera.aspect = W / H; camera.fov = blenderVFov(); camera.updateProjectionMatrix();
  renderer.render(scene, camera);

  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const ctx = out.getContext('2d');
  // Background
  ctx.fillStyle = '#F4F1EB'; ctx.fillRect(0, 0, W, H);
  // 3D
  ctx.drawImage(renderer.domElement, 0, 0, W, H);

  // Chrome — bracket corners
  ctx.strokeStyle = 'rgba(10,10,8,.40)';
  ctx.lineWidth = 2;
  const sz = 36, pad = 36;
  ctx.beginPath();
  // top-left
  ctx.moveTo(pad, pad + sz); ctx.lineTo(pad, pad); ctx.lineTo(pad + sz, pad);
  // top-right
  ctx.moveTo(W - pad - sz, pad); ctx.lineTo(W - pad, pad); ctx.lineTo(W - pad, pad + sz);
  // bottom-left
  ctx.moveTo(pad, H - pad - sz); ctx.lineTo(pad, H - pad); ctx.lineTo(pad + sz, H - pad);
  // bottom-right
  ctx.moveTo(W - pad - sz, H - pad); ctx.lineTo(W - pad, H - pad); ctx.lineTo(W - pad, H - pad - sz);
  ctx.stroke();

  // Text — LAB / PENDULUM / inverted / equation / readout
  ctx.fillStyle = 'rgba(10,10,8,.62)';
  ctx.font = '600 22px "Geist Mono", ui-monospace, monospace';
  ctx.fillText('[ LAB / 04 ]   —   2026 · v0.1', 72, 80);

  ctx.fillStyle = '#0A0A08';
  ctx.font = '900 96px Geist, sans-serif';
  ctx.fillText('PENDULUM.', 72, 200);
  const titleW = ctx.measureText('PENDULUM.').width;
  ctx.fillStyle = ACCENT.mid;
  ctx.font = 'italic 72px "Instrument Serif", serif';
  ctx.fillText('inverted.', 72 + titleW + 22, 200);

  ctx.fillStyle = 'rgba(10,10,8,.56)';
  ctx.font = 'italic 36px "Instrument Serif", serif';
  ctx.fillText('J θ̈ + b θ̇ = τ + m g l sin(θ)', 72, 260);

  // Readout
  ctx.fillStyle = '#0A0A08';
  ctx.font = '500 22px "Geist Mono", ui-monospace, monospace';
  const theta = wrap(sim.state.theta);
  const lines = [
    `θ  = ${theta.toFixed(3)} rad`,
    `θ̇  = ${sim.state.omega.toFixed(2)} rad/s`,
    `τ  = ${sim.lastTau.toFixed(2)} N·m`,
    `region · ${sim.lastRegion.toUpperCase()}`,
  ];
  for (let i = 0; i < lines.length; i++) {
    ctx.textAlign = 'right';
    ctx.fillText(lines[i], W - 72, 80 + i * 32);
  }
  ctx.textAlign = 'left';

  // Restore renderer
  renderer.setPixelRatio(prevPR);
  renderer.setSize(prevSize.x, prevSize.y, false);
  camera.aspect = prevSize.x / prevSize.y; camera.fov = blenderVFov(); camera.updateProjectionMatrix();

  // Shift+click → copy to clipboard. Plain click → download.
  out.toBlob(async blob => {
    const name = `pendulum-${Date.now()}.png`;
    if (wantsClipboard && navigator.clipboard && window.ClipboardItem) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast(`<span class="accent">[ ⧉ ]</span>&nbsp;&nbsp;copied to clipboard`);
        return;
      } catch (err) {
        // fall through to download
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    showToast(`<span class="accent">[ ⤓ ]</span>&nbsp;&nbsp;${name}`);
  }, 'image/png');
});

// ── Tweaks panel ───────────────────────────────────────────────────────────
const tweaksEl = document.getElementById('tweaks');
const tweaksFab = document.getElementById('tweaks-open');

function openTweaks(open) {
  tweaksEl.classList.toggle('hidden', !open);
  tweaksFab.classList.toggle('hidden', open);
}
tweaksFab.addEventListener('click', () => openTweaks(true));
document.getElementById('tweaks-close').addEventListener('click', () => openTweaks(false));

function bindSlider(id, valId, onChange, fmt = v => v) {
  const el = document.getElementById(id);
  const valEl = document.getElementById(valId);
  el.addEventListener('input', () => {
    const v = parseFloat(el.value);
    valEl.textContent = fmt(v);
    onChange(v);
  });
}
bindSlider('t-kp', 't-kp-val', v => PHYS.Kp = v);
bindSlider('t-kd', 't-kd-val', v => PHYS.Kd = v, v => v.toFixed(1));
function showTheta0() {
  document.getElementById('t-ca-val').textContent = PHYS.theta0.toFixed(2);
  document.getElementById('t-ca').value = PHYS.theta0.toFixed(2);
}
bindSlider('t-tmax', 't-tmax-val', v => {
  // Slider repurposed: Vmax (voltage cap). Re-derive theta0 + Tt.
  PHYS.Vmax = v;
  PHYS.theta0 = Math.asin(Math.min(1, (PHYS.K * PHYS.Vmax) / (PHYS.m * PHYS.g * PHYS.l * PHYS.R)));
  PHYS.Tt = -PHYS.m * PHYS.g * PHYS.l * (1 - Math.cos(PHYS.theta0 / 2));
  showTheta0();
}, v => v.toFixed(1));
showTheta0();   // t-ca slider is disabled/read-only; showTheta0 keeps it in sync

document.getElementById('t-mode').addEventListener('change', e => { sim.mode = e.target.value; });
document.getElementById('t-reset').addEventListener('click', () => resetSim());
document.getElementById('t-perturb').addEventListener('click', () => {
  sim.state.omega += (Math.random() > 0.5 ? 1 : -1) * 1.3;
  pulseBob();
});

document.querySelectorAll('.swatches .sw').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.swatches .sw').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    setAccent(btn.dataset.c);
    try { localStorage.setItem('pendulum.accent', btn.dataset.c); } catch {}
    // Repaint live 3D references; canvases + gizmo read ACCENT next frame.
    massHighlightables.forEach(m => { if (m.material && m.material.emissive) m.material.emissive.setHex(accentHex); });
    partRegistry.forEach(o => { if (o.material && o.material.emissive && o.material.emissiveIntensity > 0.01) o.material.emissive.setHex(accentHex); });
    rim.color.setHex(accentHex);
  });
});
// Restore saved accent (3D emissives pick accentHex up at GLB load; nothing
// is lit before then, so only the rim needs an explicit repaint here).
const savedAccent = (() => { try { return localStorage.getItem('pendulum.accent'); } catch { return null; } })();
const accentBtn = document.querySelector(`.swatches .sw[data-c="${savedAccent}"]`)
  || document.querySelector('.swatches .sw[data-c="#D4FF3A"]');
accentBtn.classList.add('active');
if (savedAccent && savedAccent !== '#D4FF3A') { setAccent(savedAccent); rim.color.setHex(accentHex); }

window.addEventListener('keydown', (e) => {
  if (e.target && e.target.closest && e.target.closest('input, select, textarea')) return;
  // T and ?// all toggle the tweaks panel (panel is visible by default on
  // desktop; these keys remain for re-opening after close + muscle memory).
  if (e.key === 't' || e.key === 'T' || e.key === '?' || e.key === '/') {
    openTweaks(tweaksEl.classList.contains('hidden'));
  }
});

window.addEventListener('resize', () => {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));  // display moves
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.fov = blenderVFov();   // keep Blender horizontal framing across aspects
  camera.updateProjectionMatrix();
});
