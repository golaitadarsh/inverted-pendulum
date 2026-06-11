"""
mass_properties.py - derive REAL pendulum physics from the CAD parts (cad skill runtime).

Loads the individual swing-assembly STEP parts (already stored under
assets/mass/), assigns a material density per part, and computes:

    m_total : total swinging mass            [kg]
    J       : inertia about the shaft axis   [kg m^2]   <- report's J
    l       : COM distance from shaft axis   [m]
    mgl     : gravity torque amplitude       [N m]      <- report's mgl

The shaft (rotation) axis is recovered from the two coupler centroids, which
sit on the motor shaft. Everything is computed in the STEP file's own
coordinate system, so it is independent of the Blender scene scale.

Run with the cad-skill venv:
    physics/.cadvenv/bin/python physics/mass_properties.py
"""

import os
import math

from build123d import import_step
from OCP.GProp import GProp_GProps
from OCP.BRepGProp import BRepGProp
from OCP.gp import gp_Ax1, gp_Pnt, gp_Dir

ASSETS = os.path.normpath(os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "assets", "mass"))

# Material density [kg/m^3]. Bolts/rod/screw = steel; couplers = aluminium.
# Bolts dominate mass, so coupler choice barely moves mgl/J. Documented guess.
STEEL = 7850.0
ALU = 2700.0

PARTS = {
    "swinging_support_rod.step": STEEL,
    "mass_big_bolt_L.step":      STEEL,   # the bob (dominant mass)
    "mass_big_bolt_U.step":      STEEL,   # the bob (dominant mass)
    "mass_small_bolt.step":      STEEL,
    "mass_screw.step":           STEEL,
    "motor_coupler.step":        ALU,
    "encoder_coupler.step":      ALU,
}
COUPLERS = ("motor_coupler.step", "encoder_coupler.step")

# STEP linear unit -> metre. Fusion/FreeCAD STEP exports are millimetres.
MM = 1e-3
G = 9.81


def gprops(shape):
    p = GProp_GProps()
    BRepGProp.VolumeProperties_s(shape.wrapped, p)
    return p


def main():
    data = {}
    for fname, dens in PARTS.items():
        path = os.path.join(ASSETS, fname)
        shp = import_step(path)
        p = gprops(shp)
        vol_mm3 = p.Mass()              # density=1 -> this is volume in mm^3
        vol_m3 = vol_mm3 * (MM ** 3)
        mass = vol_m3 * dens
        c = p.CentreOfMass()
        com_mm = (c.X(), c.Y(), c.Z())
        data[fname] = dict(props=p, mass=mass, com_mm=com_mm, vol_m3=vol_m3, dens=dens)
        print(f"{fname:28s} vol={vol_m3*1e6:8.2f} cm^3  mass={mass*1000:7.1f} g  "
              f"COM(mm)=({com_mm[0]:7.1f},{com_mm[1]:7.1f},{com_mm[2]:7.1f})")

    # --- shaft axis from coupler centroids ---
    a = data[COUPLERS[0]]["com_mm"]
    b = data[COUPLERS[1]]["com_mm"]
    axis_vec = tuple(b[i] - a[i] for i in range(3))
    norm = math.sqrt(sum(x * x for x in axis_vec))
    axis_dir = tuple(x / norm for x in axis_vec)
    axis_pt = a  # a point on the shaft line (mm)
    print(f"\nshaft axis dir = ({axis_dir[0]:+.4f},{axis_dir[1]:+.4f},{axis_dir[2]:+.4f})"
          f"  through (mm) ({axis_pt[0]:.1f},{axis_pt[1]:.1f},{axis_pt[2]:.1f})")

    ax = gp_Ax1(gp_Pnt(*axis_pt), gp_Dir(*axis_dir))

    # --- total mass, combined COM, J about shaft axis ---
    m_total = sum(d["mass"] for d in data.values())
    com_tot = [0.0, 0.0, 0.0]
    for d in data.values():
        for i in range(3):
            com_tot[i] += d["mass"] * d["com_mm"][i]
    com_tot = [c / m_total for c in com_tot]

    # MomentOfInertia(axis) with density=1 gives volume-inertia in mm^5.
    # Multiply by part density and convert mm^5 -> m^5 (1e-15), giving kg*m^2.
    J = 0.0
    for d in data.values():
        Ivol_mm5 = d["props"].MomentOfInertia(ax)
        J += d["dens"] * Ivol_mm5 * (MM ** 5)

    # lever arm: perpendicular distance from shaft axis to total COM
    d_vec = [com_tot[i] - axis_pt[i] for i in range(3)]
    dot = sum(d_vec[i] * axis_dir[i] for i in range(3))
    perp = [d_vec[i] - dot * axis_dir[i] for i in range(3)]
    l_mm = math.sqrt(sum(x * x for x in perp))
    l = l_mm * MM
    mgl = m_total * G * l

    print(f"\n=== SWING ASSEMBLY PHYSICS (from CAD) ===")
    print(f"  m_total = {m_total:.4f} kg")
    print(f"  J (about shaft axis) = {J:.6f} kg m^2")
    print(f"  l (COM lever arm)    = {l*1000:.2f} mm  ({l:.4f} m)")
    print(f"  mgl = {mgl:.4f} N m")
    print(f"\nPaste into pendulum_sim.py PARAMS:  J={J:.4f}, mgl={mgl:.4f}")
    return dict(m_total=m_total, J=J, l=l, mgl=mgl)


if __name__ == "__main__":
    main()
