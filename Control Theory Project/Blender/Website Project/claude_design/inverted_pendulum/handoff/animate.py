"""
animate.py — Inverted Pendulum walkthrough automation.

Run inside Blender (Scripting workspace). Assumes the scene already contains
the named objects listed in README.md. Reads theta_history.json from the
same folder as this file.

What it does:
  1. Validates expected objects exist.
  2. Applies render/world/color-management settings from BLENDER_SPEC.md.
  3. Adds the cinematic lights (key, fill, rim) if missing.
  4. Records exploded-vs-assembled positions for each part (uses CURRENT
     transforms as the assembled state — so position your parts in the
     assembled state in Blender before running).
  5. Generates exploded positions automatically along sensible axes; you
     can override by editing EXPLODED_OFFSETS below.
  6. Keyframes everything: camera path, part assembly, pendulum rotation
     driven by theta_history.json, light energy pulses, mass emission
     pulse on PD-catch.
  7. Sets frame range and output path.

After running: hit Render → Render Animation (Ctrl+F12) or use the CLI
(`blender -b scene.blend -P animate.py -a`).
"""

import bpy
import json
import math
import os
from mathutils import Vector

# ─── Config ────────────────────────────────────────────────────────────────────

FPS = 30
DURATION_S = 30
TOTAL_FRAMES = FPS * DURATION_S  # 900

HERE = os.path.dirname(os.path.abspath(bpy.data.filepath or __file__))
THETA_PATH = os.path.join(HERE, 'theta_history.json')
RENDER_DIR = os.path.join(HERE, 'render')
os.makedirs(RENDER_DIR, exist_ok=True)

# Object name map. Update if your scene uses different names.
PARTS = {
    'arduino':     'arduino_uno',
    'driver_brd':  'breadboard',          # if you have a separate driver PCB, swap this
    'motor':       'motor',
    'encoder':     'encoder',
    'mass':        'mass',
    'psu':         '12V_10A',
    'base':        'base_support_stand',
    'motor_std':   'motor_support_stand',
    'enc_std':     'encoder_support_stand',
}
CAM_NAME = 'camera'
EXISTING_LIGHT = 'light'

# Pendulum: which object's Z-rotation around its pivot drives theta?
# If your `mass` is parented to a pivot empty (recommended), name that empty
# 'pendulum_pivot' and we'll rotate it; otherwise we rotate `mass` directly.
PIVOT_CANDIDATES = ['pendulum_pivot', 'mass']

# Exploded offsets (relative to assembled position, in meters). Positive
# numbers push outward — adjust per your scene scale.
EXPLODED_OFFSETS = {
    'arduino_uno':            Vector(( -0.6,  0.4, 0.2)),
    'breadboard':             Vector(( -0.4,  0.5, 0.3)),
    'motor':                  Vector((  0.0,  0.0, 0.4)),
    'encoder':                Vector((  0.4,  0.0, 0.4)),
    'mass':                   Vector((  0.0,  0.0, 0.6)),
    '12V_10A':                Vector(( -0.7, -0.4, 0.1)),
    'base_support_stand':     Vector((  0.0, -0.5, 0.0)),
    'motor_support_stand':    Vector(( -0.3,  0.0, 0.2)),
    'encoder_support_stand':  Vector((  0.3,  0.0, 0.2)),
}

# Camera keyframes — (frame, location, rotation_euler_deg)
CAM_KEYS = [
    (1,   (0.00,  0.00,  2.60), (  0,  0,   0)),
    (240, (0.00,  0.00,  2.60), (  0,  0,   0)),
    (270, (1.30, -1.30,  1.00), ( 62,  0,  45)),
    (420, (1.20, -1.40,  0.70), ( 75,  0,  42)),
    (600, (1.05, -1.25,  0.65), ( 76,  0,  42)),
    (870, (1.02, -1.22,  0.65), ( 76,  0,  42)),
    (900, (1.02, -1.22,  0.65), ( 76,  0,  42)),
]

ACID = (0.831, 1.000, 0.227)  # #D4FF3A in linear-ish sRGB

# ─── Validation ────────────────────────────────────────────────────────────────

def require_objects():
    missing = []
    needed = list(PARTS.values()) + [CAM_NAME]
    for name in needed:
        if name not in bpy.data.objects:
            missing.append(name)
    if missing:
        raise RuntimeError(
            "Missing objects in scene: " + ", ".join(missing) +
            ".\nUpdate the PARTS dict at the top of animate.py if your "
            "scene uses different names."
        )

# ─── Render / world setup ─────────────────────────────────────────────────────

def setup_render():
    s = bpy.context.scene
    s.render.engine = 'CYCLES'
    s.cycles.samples = 256
    s.cycles.use_denoising = True
    s.cycles.denoiser = 'OPENIMAGEDENOISE'
    s.render.resolution_x = 1920
    s.render.resolution_y = 1080
    s.render.resolution_percentage = 100
    s.render.fps = FPS
    s.frame_start = 1
    s.frame_end = TOTAL_FRAMES
    s.render.filepath = os.path.join(RENDER_DIR, '')
    s.render.image_settings.file_format = 'PNG'
    s.render.image_settings.color_mode = 'RGB'
    s.render.image_settings.color_depth = '16'
    s.render.image_settings.compression = 50
    s.render.film_transparent = False
    s.render.filter_size = 1.5

    s.view_settings.view_transform = 'AgX'
    try:
        s.view_settings.look = 'AgX - Base Contrast'  # closest stock; user can switch to Low Contrast manually
    except Exception:
        pass
    s.view_settings.exposure = 0
    s.view_settings.gamma = 1

    # World
    world = bpy.data.worlds.get('World') or bpy.data.worlds.new('World')
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs[0].default_value = (0.0029, 0.0029, 0.0023, 1.0)
        bg.inputs[1].default_value = 0.15


# ─── Lights ────────────────────────────────────────────────────────────────────

def make_light(name, light_type, location, energy, color, size=0.6, spot_size=math.radians(45)):
    if name in bpy.data.objects:
        return bpy.data.objects[name]
    light_data = bpy.data.lights.new(name=name, type=light_type)
    light_data.energy = energy
    light_data.color = color
    if light_type == 'AREA':
        light_data.shape = 'SQUARE'
        light_data.size = size
    if light_type == 'SPOT':
        light_data.spot_size = spot_size
        light_data.spot_blend = 0.4
    obj = bpy.data.objects.new(name=name, object_data=light_data)
    obj.location = location
    bpy.context.collection.objects.link(obj)
    # aim at origin
    direction = -Vector(location)
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = direction.to_track_quat('-Z', 'Y')
    obj.rotation_mode = 'XYZ'
    return obj


def setup_lights():
    make_light('key',  'AREA', (1.2, -1.5, 1.8), 800, (1.0, 0.945, 0.864))
    make_light('fill', 'AREA', (-1.5, 0.6, 1.0), 220, (0.784, 0.847, 1.0), size=1.0)
    rim = make_light('rim', 'SPOT', (0.0, 1.8, 1.4), 0, ACID, spot_size=math.radians(45))
    # rim pulses at PD-catch (frame 420) and during recovery (510)
    rim.data.energy = 0
    rim.data.keyframe_insert('energy', frame=1)
    rim.data.keyframe_insert('energy', frame=415)
    rim.data.energy = 350
    rim.data.keyframe_insert('energy', frame=420)
    rim.data.keyframe_insert('energy', frame=505)
    rim.data.energy = 0
    rim.data.keyframe_insert('energy', frame=515)

    # existing light: halve
    if EXISTING_LIGHT in bpy.data.objects:
        l = bpy.data.objects[EXISTING_LIGHT]
        if l.type == 'LIGHT':
            l.data.energy *= 0.5


# ─── Assembly (parts move from exploded → assembled) ─────────────────────────

def key_assembly():
    """Frames 1-240: parts at exploded positions. 243-267: animate to assembled."""
    stagger = 2  # frames between part starts
    for i, (key, name) in enumerate(PARTS.items()):
        obj = bpy.data.objects.get(name)
        if not obj:
            continue
        assembled = obj.location.copy()
        exploded = assembled + EXPLODED_OFFSETS.get(name, Vector((0, 0, 0.3)))

        start = 1
        hold_until = 240 + i * stagger
        move_to = hold_until + 24  # 800 ms ease-out

        # at exploded
        obj.location = exploded
        obj.keyframe_insert('location', frame=start)
        obj.keyframe_insert('location', frame=hold_until)
        # move
        obj.location = assembled
        obj.keyframe_insert('location', frame=move_to)


# ─── Pendulum motion from theta_history.json ─────────────────────────────────

def find_pivot():
    for n in PIVOT_CANDIDATES:
        if n in bpy.data.objects:
            return bpy.data.objects[n]
    return None


def key_pendulum():
    """Drive pendulum rotation from sampled (t, theta) history.

    The JSON file is an array of {t, theta} objects (seconds, radians, where
    theta=0 is upright and theta=π is straight down). We resample at video
    rate and start playback at frame 273 (9.1s into the video — see storyboard).
    """
    pivot = find_pivot()
    if not pivot:
        print("WARN: no pendulum pivot found. Skipping pendulum keyframes.")
        return

    if not os.path.exists(THETA_PATH):
        print(f"WARN: {THETA_PATH} missing. Skipping pendulum keyframes.")
        return

    with open(THETA_PATH) as f:
        samples = json.load(f)

    # Map: video frame 273 ↔ sim t=0. Sim runs until end of swing-up + balance.
    PLAYBACK_START = 273  # 9.1s
    PLAYBACK_END = 600    # 20.0s
    sim_duration_s = (PLAYBACK_END - PLAYBACK_START) / FPS  # 10.9s

    # Trim/scale samples to fit
    sim_t_max = samples[-1]['t']
    scale = sim_duration_s / sim_t_max if sim_t_max > sim_duration_s else 1.0

    # Hanging-down before playback
    pivot.rotation_euler.z = 0  # rod at θ=π handled below — adapt to your axis
    # NOTE: in your scene the pendulum may rotate around X or Y. Adjust the
    # axis assignment below if Z is wrong.
    PENDULUM_AXIS = 'z'  # one of 'x' / 'y' / 'z'

    def set_theta(theta):
        setattr(pivot.rotation_euler, PENDULUM_AXIS, theta)

    set_theta(math.pi)  # hanging
    pivot.keyframe_insert('rotation_euler', frame=240)
    pivot.keyframe_insert('rotation_euler', frame=PLAYBACK_START - 1)

    for s in samples:
        frame = PLAYBACK_START + int(s['t'] * scale * FPS)
        if frame > PLAYBACK_END:
            break
        set_theta(s['theta'])
        pivot.keyframe_insert('rotation_euler', frame=frame)


# ─── Mass emission pulse on PD-catch ─────────────────────────────────────────

def key_mass_emission_pulse():
    mass = bpy.data.objects.get(PARTS['mass'])
    if not mass or not mass.data.materials:
        print("WARN: mass has no material. Skipping emission pulse.")
        return
    mat = mass.data.materials[0]
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get('Principled BSDF')
    if not bsdf:
        return
    bsdf.inputs['Emission Color'].default_value = (*ACID, 1.0)
    # strength 0 except during the catch
    bsdf.inputs['Emission Strength'].default_value = 0
    bsdf.inputs['Emission Strength'].keyframe_insert('default_value', frame=415)
    bsdf.inputs['Emission Strength'].default_value = 4.0
    bsdf.inputs['Emission Strength'].keyframe_insert('default_value', frame=420)
    bsdf.inputs['Emission Strength'].default_value = 0
    bsdf.inputs['Emission Strength'].keyframe_insert('default_value', frame=440)


# ─── Camera ───────────────────────────────────────────────────────────────────

def key_camera():
    cam = bpy.data.objects[CAM_NAME]
    cam.data.lens = 35
    cam.data.sensor_width = 36
    cam.data.dof.use_dof = True
    cam.data.dof.aperture_fstop = 2.8

    for frame, loc, rot_deg in CAM_KEYS:
        cam.location = loc
        cam.rotation_mode = 'XYZ'
        cam.rotation_euler = tuple(math.radians(d) for d in rot_deg)
        cam.keyframe_insert('location', frame=frame)
        cam.keyframe_insert('rotation_euler', frame=frame)

    # DOF focus tracks the pendulum's bob
    mass = bpy.data.objects.get(PARTS['mass'])
    if mass:
        cam.data.dof.focus_object = mass

    # Set easing to ease-out on all camera F-curves
    if cam.animation_data and cam.animation_data.action:
        for fcurve in cam.animation_data.action.fcurves:
            for kp in fcurve.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.easing = 'EASE_OUT'


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("[animate.py] Validating scene…")
    require_objects()
    print("[animate.py] Setting up render…")
    setup_render()
    print("[animate.py] Setting up lights…")
    setup_lights()
    print("[animate.py] Keyframing camera…")
    key_camera()
    print("[animate.py] Keyframing assembly…")
    key_assembly()
    print("[animate.py] Keyframing pendulum…")
    key_pendulum()
    print("[animate.py] Keyframing mass emission pulse…")
    key_mass_emission_pulse()
    print("[animate.py] Done. Frame range:", 1, "–", TOTAL_FRAMES)
    print("[animate.py] Render output:", RENDER_DIR)


if __name__ == '__main__':
    main()
