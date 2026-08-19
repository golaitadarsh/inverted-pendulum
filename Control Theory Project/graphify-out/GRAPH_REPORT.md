# Graph Report - .  (2026-06-12)

## Corpus Check
- 48 files · ~429,244 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 416 nodes · 618 edges · 37 communities detected
- Extraction: 83% EXTRACTED · 17% INFERRED · 1% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.78)
- Token cost: 253,900 input · 55,000 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Control Theory Core|Control Theory Core]]
- [[_COMMUNITY_Design System Boards|Design System Boards]]
- [[_COMMUNITY_Website App Runtime|Website App Runtime]]
- [[_COMMUNITY_Blender Animation Script|Blender Animation Script]]
- [[_COMMUNITY_Physics Baking Pipeline|Physics Baking Pipeline]]
- [[_COMMUNITY_Hardware Demo Videos|Hardware Demo Videos]]
- [[_COMMUNITY_Simulator Modes & Physics|Simulator Modes & Physics]]
- [[_COMMUNITY_Tweaks Panel Controls|Tweaks Panel Controls]]
- [[_COMMUNITY_Mode Component Internals|Mode Component Internals]]
- [[_COMMUNITY_Design Canvas System|Design Canvas System]]
- [[_COMMUNITY_Artboard Internals|Artboard Internals]]
- [[_COMMUNITY_Canvas Component Internals|Canvas Component Internals]]
- [[_COMMUNITY_Design Primitives|Design Primitives]]
- [[_COMMUNITY_Wireframe Artboards|Wireframe Artboards]]
- [[_COMMUNITY_Tweaks Panel Screenshot|Tweaks Panel Screenshot]]
- [[_COMMUNITY_Studio Reference 3|Studio Reference 3]]
- [[_COMMUNITY_App Shell|App Shell]]
- [[_COMMUNITY_Lab Test Session Photo|Lab Test Session Photo]]
- [[_COMMUNITY_Hardware Rig Photo 1|Hardware Rig Photo 1]]
- [[_COMMUNITY_Hardware Rig Photo 2|Hardware Rig Photo 2]]
- [[_COMMUNITY_Loader Screen|Loader Screen]]
- [[_COMMUNITY_Run Simulator Screenshot|Run Simulator Screenshot]]
- [[_COMMUNITY_Drive Reference 1|Drive Reference 1]]
- [[_COMMUNITY_Education Section Reference|Education Section Reference]]
- [[_COMMUNITY_Drive Reference 2|Drive Reference 2]]
- [[_COMMUNITY_Studio Reference 2|Studio Reference 2]]
- [[_COMMUNITY_Formula Kit Reference|Formula Kit Reference]]
- [[_COMMUNITY_Portfolio Hero Reference|Portfolio Hero Reference]]
- [[_COMMUNITY_Lab Landing Reference|Lab Landing Reference]]
- [[_COMMUNITY_Social Share Card|Social Share Card]]
- [[_COMMUNITY_Studio Reference 1|Studio Reference 1]]
- [[_COMMUNITY_Dev Server|Dev Server]]
- [[_COMMUNITY_Gain Tuning Script|Gain Tuning Script]]
- [[_COMMUNITY_Grain & Materials|Grain & Materials]]
- [[_COMMUNITY_Camera FOV Mapping|Camera FOV Mapping]]
- [[_COMMUNITY_Tweak Inputs|Tweak Inputs]]
- [[_COMMUNITY_Canvas Post-It|Canvas Post-It]]

## God Nodes (most connected - your core abstractions)
1. `Energy Efficient Control of Inverted Pendulum (Patel, Kurle, Golait, Kanwat 2022)` - 16 edges
2. `App Mode Router & Physics Tick` - 16 edges
3. `PageChrome Shared Wireframe Chrome (R1-R7)` - 12 edges
4. `frame()` - 11 edges
5. `Frame Artboard Surface` - 11 edges
6. `STORYBOARD.md — 30 s · 900-frame three-scene shot list (KIT / RUN / STUDIO)` - 10 edges
7. `Brackets Corner Chrome` - 10 edges
8. `Inverted Pendulum demo walkthrough (narrated explanation of perturbation test and control system)` - 10 edges
9. `site/CLAUDE.md — live 3D site documentation (materials, physics, camera, modes, perf)` - 9 edges
10. `CuttingMat Grid Background` - 9 edges

## Surprising Connections (you probably didn't know these)
- `applyKitHighlight() + partLabels — KIT auto-cycling part isolation with callouts` --semantically_similar_to--> `STORYBOARD.md — 30 s · 900-frame three-scene shot list (KIT / RUN / STUDIO)`  [INFERRED] [semantically similar]
  Blender/Website Project/claude_design/inverted_pendulum/site/app.js → Blender/Website Project/claude_design/inverted_pendulum/handoff/STORYBOARD.md
- `main()` --references--> `Energy Efficient Control of Inverted Pendulum (Patel, Kurle, Golait, Kanwat 2022)`  [EXTRACTED]
  Blender/Website Project/physics/mass_properties.py → Inverted Pendulum/CT_Project.pdf
- `pendulum_sim.py — physics single source of truth` --implements--> `Energy Efficient Control of Inverted Pendulum (Patel, Kurle, Golait, Kanwat 2022)`  [EXTRACTED]
  Blender/Website Project/physics/pendulum_sim.py → Inverted Pendulum/CT_Project.pdf
- `Visualisation profile (K=0.06 V·s, b=0.003 N·m·s, Vmax=7 V → θ0=47°)` --references--> `Experimental video of the real pendulum rig (Google Drive folder, §VII)`  [EXTRACTED]
  Blender/Website Project/physics/pendulum_sim.py → Inverted Pendulum/CT_Project.pdf
- `Rationale: 'Why the deviations' — paper system-ID J 43× too big, K=1.1112 over-damps (K²/R=0.52 ≫ critical 0.067); CAD supplies true J/m/l` --semantically_similar_to--> `Rationale: system-ID b/mgl/K make the rig overdamped + gravity-starved on screen`  [INFERRED] [semantically similar]
  Blender/Website Project/claude_design/inverted_pendulum/site/CLAUDE.md → Blender/Website Project/physics/pendulum_sim.py

## Hyperedges (group relationships)
- **θ(t) single-source pipeline: Python sim → theta_history.json → Blender bake / video keyframes** — pendulum_sim_simulate, theta_history_json, bake_pendulum_main, animate_key_pendulum, storyboard_doc [EXTRACTED 0.95]
- **Energy-pump + PD-catch switched controller (destabiliser / stabiliser split at θ0)** — ct_destabilizing, ct_stabilizing, ct_limiting_angle_eq, pendulum_sim_control_voltage, app_js_control_voltage [EXTRACTED 0.95]
- **PD-catch acid-pulse motif across media (storyboard beat, rim light, emission pulse, live bob pulse)** — pd_catch_moment, storyboard_doc, blender_spec_doc, animate_key_mass_emission, app_js_pulse_bob [EXTRACTED 0.85]
- **Shared makeSim Instance Threaded Through App, Chrome, Run, Studio and Plots** — pp_app_App, pp_physics_makeSim, pp_app_TopChrome, pp_modes_Run, pp_modes_RunCanvas, pp_modes_Studio, pp_modes_PlotsPanel [EXTRACTED 1.00]
- **Three-Mode Demo Structure (Kit / Run / Studio) Spanning Brief, Wireframes and Prototype** — ds_artboards_IntroBoard, pp_app_ModePicker, pp_modes_Kit, pp_modes_Run, pp_modes_Studio, wf_artboards_WFKit, wf_artboards_WFRun, wf_artboards_WFStudioDiagram [INFERRED 0.85]
- **Shared PD Gains (Kp 196 / Kd 28) and Open-Loop Poles (-14.27, -2.94, +0.01) Narrative** — pp_physics_PHYS, ds_artboards_IntroBoard, ds_artboards_PanelBoard, ds_artboards_LoaderBoard, pp_modes_Loader, pp_modes_MathPanel, pp_modes_PlotsPanel, wf_artboards_WFStudioMath, wf_artboards_WFStudioPlots [INFERRED 0.85]
- **Sensor-to-actuator feedback control loop (encoder/current sensing -> differentiation -> Kalman filtering -> PID -> motor voltage)** — inverted_pendulum_encoder, inverted_pendulum_current_sensor, inverted_pendulum_velocity_differentiation, inverted_pendulum_kalman_filter, inverted_pendulum_pid_control, inverted_pendulum_motor_voltage_control [EXTRACTED 1.00]
- **Inverted pendulum demo video series (clips documenting the same balancing robot)** — img_3761_clip, img_3760_clip, img_3758_clip, img_3759_clip, huut2951_clip, img_3752_1_clip, img_3797_clip, inverted_pendulum_demo_walkthrough, img_3796_clip, img_3753_clip [INFERRED 0.70]

## Communities

### Community 0 - "Control Theory Core"
Cohesion: 0.1
Nodes (35): controlVoltage() — JS two-mode controller (pd / swingup / idle / off regions), drawPoleZero() — open-loop pole-zero map of CAD plant (poles +6.87, −2.45, −7.47), PHYS — JS physics constants (mirrors pendulum_sim PARAMS; derives θ0 + Tt), physicsStep() — fractional-substep accumulator + NaN/Inf reset guard, rhs() — JS plant ODE right-hand side, rk4() — JS 3-state RK4 integrator (θ, ω, i), CAD-derived plant parameters (J=0.00467 kg·m², mgl=0.2438 N·m, m=0.1501 kg, l=0.1655 m), Destabilising controller — V = Vmax·signum(θ̇) with energy switch T<Tt; T=−mgl(1−cosθ)+½Jθ̇², Tt=−mgl(1−cos(θ0/2)) (eqs 11-14) (+27 more)

### Community 1 - "Design System Boards"
Cohesion: 0.13
Nodes (37): A11yBoard Accessibility Guard-rails Artboard, ChromeBoard Brackets+Crosshairs Motif Artboard, IntroBoard Project Brief Artboard, LoaderBoard Boot Sequence Artboard, MotionBoard Motion Tokens Artboard, PaletteBoard Color System Artboard, PanelBoard Studio Panels & Tiles Artboard, PillBoard Mode Pill States Artboard (+29 more)

### Community 2 - "Website App Runtime"
Cohesion: 0.1
Nodes (24): applyKitHighlight(), blenderVFov(), clearKitHighlight(), controlVoltage(), dismissHero(), drawPhase(), drawPlot(), drawPoleZero() (+16 more)

### Community 3 - "Blender Animation Script"
Cohesion: 0.13
Nodes (29): find_pivot(), key_assembly(), key_camera(), key_mass_emission_pulse() — acid emission pulse on the bob at PD catch (frames 415-440), key_mass_emission_pulse(), key_pendulum(), main(), make_light() (+21 more)

### Community 4 - "Physics Baking Pipeline"
Cohesion: 0.12
Nodes (20): app.js — Three.js scene + RK4 physics + controller + mode router + plots, Share-frame capture — 1920×1080 PNG with bracket chrome, title, equation, readout, bbox_center(), _fcurves(), main(), Rationale: quaternion keyframes — swing axis sits near Euler gimbal lock, Euler baking would flip, bake_pendulum.py - bake the simulated theta(t) onto the `mass` empty in Blender., All F-curves for obj, across Blender <4.4 (action.fcurves) and 4.4+/5.x     slot (+12 more)

### Community 5 - "Hardware Demo Videos"
Cohesion: 0.15
Nodes (21): Demo clip HUUT2951 (hardware demo, no speech content), Demo clip IMG_3752 1 (noise transcript 'RANDOM LOWEI', no meaningful speech), Demo clip IMG_3753 (Hindi/ambient fragment, no content), Demo clip IMG_3758: 'PID feedback stabilization robot with motor control' narration, PID feedback stabilization robot (physical inverted-pendulum hardware), Demo clip IMG_3759: fragmentary PID input mention ('PID is now looking at the input of the PID'), Demo clip IMG_3760 (hardware demo, no speech content), Demo clip IMG_3761: motor control demo intro ('how to use motor control') (+13 more)

### Community 6 - "Simulator Modes & Physics"
Cohesion: 0.22
Nodes (16): AngleDial Theta Gauge, Bar Bipolar HUD Bar, DiagramPanel Block Diagram Cycler, MathPanel Equations & Gains, PlotsPanel Pole-Zero + Live Trace, Run Live Sim Mode (HUD + Perturb), RunCanvas 2D Pendulum Renderer, Studio Mode (Dimmed Rig + Sub-panels) (+8 more)

### Community 7 - "Tweaks Panel Controls"
Cohesion: 0.13
Nodes (0): 

### Community 8 - "Mode Component Internals"
Cohesion: 0.14
Nodes (0): 

### Community 9 - "Design Canvas System"
Cohesion: 0.18
Nodes (13): DCArtboard Marker Component, DCArtboardFrame Card + Header + Menu, DCFocusOverlay Fullscreen Focus Mode, DCSection Reorderable Artboard Row, DCViewport Pan/Zoom Transform Engine, DesignCanvas Stateful Canvas Wrapper, dcExport PNG/HTML Artboard Exporter, TweaksUI Prototype Tweaks Form (+5 more)

### Community 10 - "Artboard Internals"
Cohesion: 0.18
Nodes (0): 

### Community 11 - "Canvas Component Internals"
Cohesion: 0.22
Nodes (3): dcFlatten(), DCSection(), DesignCanvas()

### Community 12 - "Design Primitives"
Cohesion: 0.2
Nodes (0): 

### Community 13 - "Wireframe Artboards"
Cohesion: 0.22
Nodes (0): 

### Community 14 - "Tweaks Panel Screenshot"
Cohesion: 0.36
Nodes (8): Accent Color Picker (lime / orange / blue / off-white swatches), Live Telemetry Readout (theta = 0.014 rad, theta_dot = -0.32 rad/s, 60 fps, ode/rk4), MATH Modal (plant J*theta_dd + b*theta_d = K*i + mgL*sin(theta), destabilizer V = Vmax*sgn(theta), PD control), Tweaks Settings Panel (floating bottom-right customization popover), PD Control Gains and Poles (Kp=196, Kd=28, Kp_i=446; poles -14.27, -2.94, +0.01), Stability Note (third pole slightly in right-half plane; open-loop rod falls; PD closed-loop critically damped, settles under one second), Surface Theme Toggles (Studio: light surface, Kit: light surface, Show key hints overlay), PENDULUM. inverted. Lab Website (LAB/04, 2026, V0.1; dark grid lab aesthetic with KIT/RUN/STUDIO sections)

### Community 15 - "Studio Reference 3"
Cohesion: 0.36
Nodes (8): Craft-Table Diorama Props (denim cutting mat, scissors, ruler, paint pots), Drivable Miniature Formula 1 Car Model, Minimal HUD Overlay: LAB tag, project title (prefix AMBIGUOUS), Prev/Next navigation, Keyboard Drive Controls ('WASD / Arrows to drive'), Heintzmann Studio LAB: Interactive 3D Playground Scene, Bottom Mode Switcher Buttons (Kit / Drive / Studio — labels partly AMBIGUOUS), Design Direction for Inverted Pendulum Project Website (interactive 3D hardware viewer), Neutral Studio Lighting / Product-Render Aesthetic (dark vignette, seamless backdrop)

### Community 16 - "App Shell"
Cohesion: 0.29
Nodes (0): 

### Community 17 - "Lab Test Session Photo"
Cohesion: 0.38
Nodes (7): ASUS TUF Laptop (development/HIL machine), Laser-Cut Wooden Pendulum Test Rig, Bench Power Supply Unit (silver SMPS box with fan), Rotary Encoder Sensor (black disc, cabled), Live Scope Waveform (oscillating angle/sensor signal), MATLAB Simulink Block Diagram Model, Team Hardware Testing Session

### Community 18 - "Hardware Rig Photo 1"
Cohesion: 0.38
Nodes (7): Breadboard with Jumper Wiring, Brushed DC Motor (775-class, silver body), Electronics Modules with Lit Red LEDs (likely motor driver / IMU), Laser-cut MDF Finger-jointed Frame, Inverted Pendulum Hardware Prototype (Bench Test Rig), Metal Power Supply / Charger Box (yellow caution label), Pendulum Rod with Coil Spring and White Tip

### Community 19 - "Hardware Rig Photo 2"
Cohesion: 0.43
Nodes (7): Breadboard with Jumper Wiring (control electronics), Brushed DC Motor (775-style, frame-mounted), Laser-cut Wooden Frame (slotted side panels), Red and Blue PCB Modules (motor driver / sensor, LEDs lit), Pendulum Rod with Spring and White Pivot Hub, Inverted Pendulum Hardware Test Rig (bench prototype), Bench Switching Power Supply Unit (metal enclosure)

### Community 20 - "Loader Screen"
Cohesion: 0.33
Nodes (7): Brand Lockup: PENDULUM. (bold sans) + inverted. (italic serif accent), tagged LAB / 04 — 2026 · V0.1, Keyboard Shortcut Legend: [1 KIT] [2 RUN] [3 STUDIO] [? HELP], Lab-Terminal Design Language: near-black background, cream monospace type, corner registration/crop marks framing viewport, READOUT · LIVE telemetry panel: theta = 3.141 rad (pendulum at inverted equilibrium, ~pi), theta-dot = 0.08 rad/s, 60 (Hz), ode/rk4, Website Loader Screen (PENDULUM. inverted.) — empty stage awaiting 3D content, RK4 ODE Integrator — live in-browser pendulum physics simulation driving the readout, Section Navigation: 01 [KIT] / 02 [RUN] / 03 [STUDIO] tab buttons, KIT active (bottom-left indicator '01 — KIT.')

### Community 21 - "Run Simulator Screenshot"
Cohesion: 0.43
Nodes (7): HUD Telemetry Panel (θ angle gauge -π..π, ang vel 0.32 rad/s, motor torque 5.99 N·m, STATE · BALANCING), Live Readout (READOUT · LIVE: θ = 0.014 rad, θ̇ = -0.31 rad/s, 60 fps), PD Controller ([ PD ] tag, recovers pendulum to balancing after manual perturbation), Cart-Pendulum Live Visualization (upright, θ = 0.014 rad, click-to-impulse), Perturbation Controls (WASD push/nudge, torque scale 0.40, FIRE PERTURB / RESET / CATCH @ UPRIGHT), RUN — Interactive Pendulum Simulator (Section 02), Site Section Navigation (01 KIT / 02 RUN active / 03 STUDIO)

### Community 22 - "Drive Reference 1"
Cohesion: 0.38
Nodes (7): Inverted Pendulum Project Website Design, Kit View: Knolled Formula-Car Parts on Blue Grid Baseplate, Knolling / Model-Kit Workbench Presentation Style (scissors, ruler, hobby knife props), Heintzmann Lab [04] 'Formula' Interactive 3D Drive Experience, Minimal Dark Label-Chip UI Overlay on Full-Bleed 3D Render, [Kit] / [Drive] / [Studio] View-Mode Switcher, 'WASD / Arrows to drive' Keyboard Control Hint

### Community 23 - "Education Section Reference"
Cohesion: 0.43
Nodes (7): B.Tech Mechanical Engineering 2019-2023 (CPI 8.18/10), Dean's List Sem 4 (2021), Editorial Typographic Style (numbered eyebrow, oversized bold header, monospace metadata), Education Section UI Design (Portfolio Website), Gold Medal '23 - Outstanding Social Service (Convocation 2023), Indian Institute of Technology Gandhinagar (IITGN), Stat Card Row Pattern (CPI / Dean's List / Honour / Duration)

### Community 24 - "Drive Reference 2"
Cohesion: 0.38
Nodes (7): Top-left Caption Block: 'LAB' tag, project title lines (AMBIGUOUS small text, appears to reference an F1 subject e.g. 'Formula 1' / 'MP4/x'), Prev/Next pager, Heintzmann Portfolio 'Drive' Section Page (Workshop Scene View), Red/White Formula 1 Scale Model Car (McLaren-style livery, scene centerpiece), Workshop/Maker Staging Aesthetic (project shown amid its tools and materials), Design Pattern: Full-bleed 3D Render as the Page Itself with Minimal UI Chrome, Bottom-center Section Tabs Navigation ('Drive' active between sibling sections), 3D Hobby-Workshop Diorama (blue cutting mat with scissors, ruler, paint pots, tape, hand tools)

### Community 25 - "Studio Reference 2"
Cohesion: 0.38
Nodes (7): Craft Diorama Aesthetic (denim work mat, scissors, paint pots, ruler, tape props on gray cyclorama), Keyboard Drive Controls Overlay (WASD/Arrows to drive, Prev/Next), Drivable Formula 1 Race Car Model (red/white livery), Heintzmann Studio 'LAB' 3D Diorama Scene, Letterboxed Cinematic Framing with Minimal Monochrome UI Chips, Bottom Mode Switcher Nav (Art | Drive | Studio), Inverted Pendulum Project Website (design target)

### Community 26 - "Formula Kit Reference"
Cohesion: 0.38
Nodes (7): Formula Car Kit, Catalog Item [00] (wheels, suspension arms, chassis plate), WASD + Arrow-Key Interactive Drive Mode, Minimal HUD Overlay UI (monospace corner labels, viewfinder frame markers), Inverted Pendulum Project Website Design, Knolling Parts Layout on Blueprint Mat, Kit / Drive / Studio Mode Tabs, Heintzmann 'Formula' Interactive 3D Kit Webpage (Design Reference)

### Community 27 - "Portfolio Hero Reference"
Cohesion: 0.43
Nodes (7): Dark Olive-Black + Neon Chartreuse Color Palette, Sage-Green Duotone Portrait Photo with Neon Accent Stroke, Monospace Bio Caption: 'Mechanical Engineer... Mumbai, open to product-ops at hardware-first companies', Oversized Cropped Typographic Marquee (neon italic serif + bold white sans), Inverted Pendulum Project Website (design target), Portfolio Hero Section Design Reference (dark, editorial), Site Author Persona (Adarsh Golait, mechanical engineer, Mumbai)

### Community 28 - "Lab Landing Reference"
Cohesion: 0.33
Nodes (7): Dark 3D-Rendered Demo Thumbnails (insect on wireframe grid, magenta wave mesh, black hole, circuit schematic), Pastel Holographic/Iridescent Gradient Background (pink-mint-cyan aurora), Inverted Pendulum Project Website Design, Numbered Interactive Demo Card Grid ((01), (02)... with 'Interactive' tags), Tagline Strip: 'Code-generated design · Always in progress · Creative coding ...', Heintzmann LAB Creative-Coding Portfolio Site (design reference), Oversized Outline 'LAB' Wordmark with R&D / Demos / Explorations Descriptor

### Community 29 - "Social Share Card"
Cohesion: 0.43
Nodes (7): Enter Lab CTA + Mode Hint (Press 1-2-3 to Switch Modes), Feature Tagline: Balance Is a State - Real Blender Geometry - Live RK4 - PD Catch + Energy-Pump Swing-Up, Blender Hero Render - Pendulum Rig at Balanced Upright (MDF A-frame stands, RS-775 motor, threaded rod + bob mass, Arduino + breadboard, PSU, circular base on blue cutting mat), Lab/04 Branding: [ LAB / 04 ] Control Theory - 2026, technical-monospace light theme with green accent on PENDULUM. inverted. wordmark, Plant Equation: J th_ddot + b th_dot = tau + m g l sin(theta), OG Social Share Image (1200x630 hero card), Team Credits: Physics - Patel - Kurle - Golait - Kanwat (CT_Project 2022)

### Community 30 - "Studio Reference 1"
Cohesion: 0.47
Nodes (6): Inverted Pendulum Project Website Design, Knolling Layout of Disassembled Formula-Car Parts on Blue Blueprint Mat, Heintzmann Studio LAB '[04] Formula' 3D Web Experience Screenshot, Bottom Mode-Switcher Nav: [Kit] [Drive] [Studio], Minimal Dark Monospace Chip Overlay UI (LAB, [04] Formula, Prev/Next), WASD / Arrow-Key Drivable 3D Model Interaction

### Community 31 - "Dev Server"
Cohesion: 0.5
Nodes (2): NoCacheHandler, SimpleHTTPRequestHandler

### Community 32 - "Gain Tuning Script"
Cohesion: 1.0
Nodes (1): Refine (K, Vmax) for a graceful ~6-14 swing energy-efficient pump + catch + sett

### Community 33 - "Grain & Materials"
Cohesion: 1.0
Nodes (2): makeGrainTexture() — value-noise CanvasTexture from Blender color-ramp stops (MDF_TEX / STEEL_TEX), Blender-faithful runtime material override — procedural ramps rebuilt as value-noise CanvasTextures

### Community 34 - "Camera FOV Mapping"
Cohesion: 1.0
Nodes (2): blenderVFov() — contain-fit of the authored 16:9 Blender frame (HFOV 48.46°, 6% matte), Blender hero camera similarity transform + contain-fit FOV (composition matted, never cropped)

### Community 35 - "Tweak Inputs"
Cohesion: 1.0
Nodes (2): TweakRadio Segmented Control, TweakSelect Dropdown Control

### Community 36 - "Canvas Post-It"
Cohesion: 1.0
Nodes (1): DCPostIt Sticky Note

## Ambiguous Edges - Review These
- `IntroBoard Project Brief Artboard` → `DCArtboard Marker Component`  [AMBIGUOUS]
  Blender/Website Project/claude_design/inverted_pendulum/design-canvas.jsx · relation: conceptually_related_to
- `DCArtboard Marker Component` → `WFLoader Loader Wireframe`  [AMBIGUOUS]
  Blender/Website Project/claude_design/inverted_pendulum/design-canvas.jsx · relation: conceptually_related_to
- `PID feedback control` → `Current sensor (measures current through the motor)`  [AMBIGUOUS]
  graphify-out/transcripts/Inverted pendulum.txt · relation: shares_data_with
- `Brushed DC Motor (775-class, silver body)` → `Pendulum Rod with Coil Spring and White Tip`  [AMBIGUOUS]
  Inverted Pendulum/IMG_3757.JPG · relation: conceptually_related_to
- `Red/White Formula 1 Scale Model Car (McLaren-style livery, scene centerpiece)` → `Top-left Caption Block: 'LAB' tag, project title lines (AMBIGUOUS small text, appears to reference an F1 subject e.g. 'Formula 1' / 'MP4/x'), Prev/Next pager`  [AMBIGUOUS]
  Blender/Website Project/claude_design/inverted_pendulum/uploads/heintzmann-drive2.png · relation: references
- `Sage-Green Duotone Portrait Photo with Neon Accent Stroke` → `Site Author Persona (Adarsh Golait, mechanical engineer, Mumbai)`  [AMBIGUOUS]
  Blender/Website Project/claude_design/inverted_pendulum/uploads/pasted-1779597863903-0.png · relation: references

## Knowledge Gaps
- **71 isolated node(s):** `pendulum_sim.py - Energy-Efficient Inverted Pendulum physics, single source of t`, `theta0 = arcsin(K*Vmax / (mgl*R))  (report eq. 10). Capture half-width.`, `Integrate from hanging (theta=pi) to upright. Returns dict with traces + diagnos`, `Refine (K, Vmax) for a graceful ~6-14 swing energy-efficient pump + catch + sett`, `bake_pendulum.py - bake the simulated theta(t) onto the `mass` empty in Blender.` (+66 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Gain Tuning Script`** (2 nodes): `tune.py`, `Refine (K, Vmax) for a graceful ~6-14 swing energy-efficient pump + catch + sett`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Grain & Materials`** (2 nodes): `makeGrainTexture() — value-noise CanvasTexture from Blender color-ramp stops (MDF_TEX / STEEL_TEX)`, `Blender-faithful runtime material override — procedural ramps rebuilt as value-noise CanvasTextures`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Camera FOV Mapping`** (2 nodes): `blenderVFov() — contain-fit of the authored 16:9 Blender frame (HFOV 48.46°, 6% matte)`, `Blender hero camera similarity transform + contain-fit FOV (composition matted, never cropped)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tweak Inputs`** (2 nodes): `TweakRadio Segmented Control`, `TweakSelect Dropdown Control`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Canvas Post-It`** (1 nodes): `DCPostIt Sticky Note`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `IntroBoard Project Brief Artboard` and `DCArtboard Marker Component`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `DCArtboard Marker Component` and `WFLoader Loader Wireframe`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `PID feedback control` and `Current sensor (measures current through the motor)`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **What is the exact relationship between `Brushed DC Motor (775-class, silver body)` and `Pendulum Rod with Coil Spring and White Tip`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Red/White Formula 1 Scale Model Car (McLaren-style livery, scene centerpiece)` and `Top-left Caption Block: 'LAB' tag, project title lines (AMBIGUOUS small text, appears to reference an F1 subject e.g. 'Formula 1' / 'MP4/x'), Prev/Next pager`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Sage-Green Duotone Portrait Photo with Neon Accent Stroke` and `Site Author Persona (Adarsh Golait, mechanical engineer, Mumbai)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `site/CLAUDE.md — live 3D site documentation (materials, physics, camera, modes, perf)` connect `Physics Baking Pipeline` to `Control Theory Core`, `Blender Animation Script`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._