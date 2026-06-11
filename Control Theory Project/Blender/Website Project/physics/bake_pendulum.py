"""
bake_pendulum.py - bake the simulated theta(t) onto the `mass` empty in Blender.

Run inside the connected Blender (via the MCP execute tool or Scripting tab).

Rotates the swinging assembly about the REAL motor-shaft axis (recovered from
the coupler centroids), not the empty's own origin. theta = 0 is upright,
theta = pi is hanging down; the current Blender pose is the horizontal pose
(theta = pi/2). The axis sign is auto-resolved by testing which rotation lifts
the bob, so it is robust to scene/axis conventions.
"""

import bpy
import json
import math
import os
from mathutils import Vector, Matrix

FPS = 120
JSON_PATH = os.path.join(
    os.path.dirname(bpy.data.filepath),
    "Website Project", "physics", "theta_history.json")

PIVOT_EMPTY = "mass"
MOTOR_COUPLER = "ct motor coupler v7 (Meshed)"
ENCODER_COUPLER = "ct encoder coupler v4 (Meshed)"
BOB = "mass_big_bolt_L (Meshed)"
THETA_BASELINE = math.pi / 2.0   # current pose = horizontal


def bbox_center(name):
    o = bpy.data.objects[name]
    return sum((o.matrix_world @ Vector(c) for c in o.bound_box), Vector()) / 8.0


def _fcurves(obj):
    """All F-curves for obj, across Blender <4.4 (action.fcurves) and 4.4+/5.x
    slotted Actions (layers -> strips -> channelbag(slot).fcurves)."""
    ad = obj.animation_data
    if not ad or not ad.action:
        return []
    act = ad.action
    if hasattr(act, "fcurves") and len(act.fcurves):
        return list(act.fcurves)
    out = []
    for layer in getattr(act, "layers", []):
        for strip in layer.strips:
            try:
                cb = strip.channelbag(ad.action_slot)
            except Exception:
                cb = None
            if cb:
                out += list(cb.fcurves)
    return out


def rot_about_line(point, axis, angle):
    """World matrix that rotates `angle` rad about the line (point, axis)."""
    T = Matrix.Translation(point)
    R = Matrix.Rotation(angle, 4, axis.normalized())
    return T @ R @ T.inverted()


def main():
    with open(JSON_PATH) as f:
        samples = json.load(f)

    mass = bpy.data.objects[PIVOT_EMPTY]
    baseline = mass.matrix_world.copy()

    # shaft axis + a point on it, from the coupler centroids
    a = bbox_center(MOTOR_COUPLER)
    b = bbox_center(ENCODER_COUPLER)
    axis = (b - a).normalized()
    pivot = bbox_center("swinging_support_rod (Meshed)")  # on the shaft line

    bob0 = bbox_center(BOB)

    def world_for_theta(theta, sign):
        M = rot_about_line(pivot, axis, sign * (theta - THETA_BASELINE))
        return M @ baseline

    # auto-resolve sign: theta=0 must lift the bob (max world Z)
    def bob_z(theta, sign):
        M = rot_about_line(pivot, axis, sign * (theta - THETA_BASELINE))
        return (M @ bob0)[2]  # bob is child of mass -> transforms with same M

    sign = +1.0 if bob_z(0.0, +1.0) > bob_z(0.0, -1.0) else -1.0

    # quaternion keyframes: the swing axis sits near the empty's Euler gimbal
    # lock (baseline X=-90 deg), so Euler baking would flip. Dense 120 Hz
    # sampling keeps consecutive quats shortest-path.
    mass.rotation_mode = "QUATERNION"
    mass.animation_data_clear()

    for s in samples:
        frame = 1 + int(round(s["t"] * FPS))
        M = world_for_theta(s["theta"], sign)
        loc, quat, _ = M.decompose()
        mass.location = loc
        mass.rotation_quaternion = quat
        mass.keyframe_insert("location", frame=frame)
        mass.keyframe_insert("rotation_quaternion", frame=frame)

    for fc in _fcurves(mass):
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"
        fc.update()

    sc = bpy.context.scene
    sc.render.fps = FPS
    sc.frame_start = 1
    sc.frame_end = 1 + int(round(samples[-1]["t"] * FPS))

    # restore baseline pose at end of edit
    mass.matrix_world = baseline
    return {"sign": sign, "frames": sc.frame_end, "axis": tuple(round(x, 3) for x in axis)}


result = main()
print("BAKE:", result)
