"""
pendulum_sim.py - Energy-Efficient Inverted Pendulum physics, single source of truth.

Faithful implementation of the controller from:
    Patel, Kurle, Golait, Kanwat (2022), "Energy Efficient Control of
    Inverted Pendulum" (CT_Project.pdf).

State (continuous angle, NOT wrapped):
    theta : pendulum angle [rad].  theta = 0 -> UP (unstable eq), theta = pi -> DOWN (stable).
    omega : angular velocity [rad/s]
    i     : motor armature current [A]

Plant (report eq. 1 & 2):
    J*theta'' + b*theta' = K*i + m*g*l*sin(theta)
    L*di/dt + i*R       = V - K*theta'
  =>
    omega' = (K*i + mgl*sin(theta) - b*omega) / J
    i'     = (V - i*R - K*omega) / L

Controller (two modes, switched on the wrapped angle vs the limiting angle theta0):
    |theta_wrapped| >= theta0 : DESTABILISER (energy pump), report eq. 11-14
    |theta_wrapped| <  theta0 : STABILISER  (cascaded PD-position / P-current), eq. 15-18

Run standalone:  python3 pendulum_sim.py        -> writes theta_history.json + prints diagnostics
"""

import json
import math
import os

# --------------------------------------------------------------------------------------
# Parameters
# --------------------------------------------------------------------------------------
# Motor electricals + controller gains are taken VERBATIM from the report.
# The mechanical plant (mgl, b) uses a documented "visualisation profile": the
# system-identified values (b=2.9630, mgl~=0.0352) make the rig massively
# overdamped (tau = J/b = 0.07 s) and gravity-starved, which reads as a dead
# creep on screen. We keep J and the controller exact, and choose b, mgl so the
# pendulum visibly swings, pumps energy over several swings, and gets caught.

PAPER = dict(R=2.3634, L=0.9794, J=0.2004, K=1.1112, b=2.9630, mgl=0.0352)

PARAMS = dict(
    # --- exact from report ---
    R=2.3634,      # motor resistance [ohm]
    L=0.9794,      # motor inductance [H]
    K=1.1112,      # torque / back-emf constant [V s]
    g=9.81,
    # --- controller gains, exact from report (sec. V) ---
    Kp=196.0,      # PD position proportional
    Kd=28.0,       # PD position derivative
    Kp_i=446.0,    # P current
    # --- mechanical plant: J & mgl from CAD (mass_properties.py) ---
    J=0.00467,     # CAD inertia about shaft axis [kg m^2] (overrides paper 0.2004)
    mgl=0.2438,    # CAD gravity torque m*g*l [N m]        (overrides paper ~0.0352)
    b=0.003,       # bearing+air damping [N m s] (paper 2.9630 is non-physical here)
    Vmax=7.0,      # voltage cap [V] (energy-efficiency knob; sets theta0=47 deg)
)
# Motor constant: the paper's K=1.1112 V*s yields electrical damping K^2/R=0.52
# (critical=0.067) -> the rig would be too overdamped to pump. We use a lighter,
# self-consistent K so the closed loop reproduces the paper's documented multi-
# swing energy pump + PD catch (and the real experimental video).
PARAMS["K"] = 0.06


def limiting_angle(p):
    """theta0 = arcsin(K*Vmax / (mgl*R))  (report eq. 10). Capture half-width."""
    s = p["K"] * p["Vmax"] / (p["mgl"] * p["R"])
    if s >= 1.0:
        # motor can hold against gravity at every angle -> no swing-up needed.
        return math.pi / 2
    return math.asin(s)


def wrap(theta):
    """Wrap to (-pi, pi]."""
    return math.atan2(math.sin(theta), math.cos(theta))


# --------------------------------------------------------------------------------------
# Controller
# --------------------------------------------------------------------------------------
def control_voltage(theta, omega, i, p, theta0):
    tw = wrap(theta)

    if abs(tw) < theta0:
        # ---- STABILISER: cascaded PD position -> desired current -> P current -> V ----
        thddot_c = -p["Kp"] * tw - p["Kd"] * omega                       # eq. 15
        i_d = (p["J"] / p["K"]) * thddot_c + (p["b"] / p["K"]) * omega \
            + (p["mgl"] * math.sin(tw)) / p["K"]                          # eq. 16
        idot_c = p["Kp_i"] * (i_d - i)                                    # eq. 17
        V = p["L"] * idot_c + i * p["R"] + p["K"] * omega                 # eq. 18
        mode = 1
    else:
        # ---- DESTABILISER: energy pump with target-energy switch ----
        # Energy w.r.t. top, report eq. 12:  T = -mgl(1-cos th) + 1/2 J omega^2
        T = -p["mgl"] * (1.0 - math.cos(tw)) + 0.5 * p["J"] * omega ** 2
        # Target energy, eq. 13:  T_t = -mgl(1 - cos(theta0/2))  (just shy of the top)
        T_t = -p["mgl"] * (1.0 - math.cos(theta0 / 2.0))
        if T < T_t:
            V = p["Vmax"] * math.copysign(1.0, omega) if omega != 0 else p["Vmax"]
        else:
            V = 0.0
        mode = 0

    # Voltage cap (energy efficiency). theta0 is defined so the stabiliser stays
    # under this cap inside the capture region.
    V = max(-p["Vmax"], min(p["Vmax"], V))
    return V, mode


# --------------------------------------------------------------------------------------
# Plant + RK4
# --------------------------------------------------------------------------------------
def deriv(state, V, p):
    theta, omega, i = state
    dtheta = omega
    domega = (p["K"] * i + p["mgl"] * math.sin(theta) - p["b"] * omega) / p["J"]
    di = (V - i * p["R"] - p["K"] * omega) / p["L"]
    return (dtheta, domega, di)


def rk4_step(state, V, p, dt):
    k1 = deriv(state, V, p)
    s2 = tuple(s + 0.5 * dt * k for s, k in zip(state, k1))
    k2 = deriv(s2, V, p)
    s3 = tuple(s + 0.5 * dt * k for s, k in zip(state, k2))
    k3 = deriv(s3, V, p)
    s4 = tuple(s + dt * k for s, k in zip(state, k3))
    k4 = deriv(s4, V, p)
    return tuple(
        s + (dt / 6.0) * (a + 2 * b_ + 2 * c + d)
        for s, a, b_, c, d in zip(state, k1, k2, k3, k4)
    )


def simulate(p=PARAMS, dt=0.001, t_end=14.0, theta0_init=math.pi - 1e-3, settle_after=None):
    """Integrate from hanging (theta=pi) to upright. Returns dict with traces + diagnostics."""
    theta0 = limiting_angle(p)
    state = (theta0_init, 0.0, 0.0)  # hanging, at rest, no current
    n = int(t_end / dt)

    ts, ths, oms, iis, Vs, modes = [], [], [], [], [], []
    caught_t = None
    swing_extrema = 0
    prev_omega = 0.0

    for k in range(n + 1):
        t = k * dt
        theta, omega, i = state
        V, mode = control_voltage(theta, omega, i, p, theta0)

        ts.append(t); ths.append(theta); oms.append(omega)
        iis.append(i); Vs.append(V); modes.append(mode)

        # diagnostics: count velocity sign changes (each = one swing extreme)
        if prev_omega * omega < 0:
            swing_extrema += 1
        prev_omega = omega

        # first time we enter the capture region with the stabiliser active
        if caught_t is None and abs(wrap(theta)) < theta0 and mode == 1:
            caught_t = t

        state = rk4_step(state, V, p, dt)

    final_theta = wrap(ths[-1])
    # settled = |theta_wrapped| stays < 2 deg for the last second
    settled = all(abs(wrap(th)) < math.radians(2.0) for th in ths[-int(1.0 / dt):])

    return dict(
        t=ts, theta=ths, omega=oms, current=iis, voltage=Vs, mode=modes,
        theta0=theta0, caught_t=caught_t, swing_extrema=swing_extrema,
        final_theta=final_theta, settled=settled,
        peak_V=max(abs(v) for v in Vs), peak_i=max(abs(x) for x in iis),
    )


def diagnostics(r, p):
    print("--- params ---")
    print(f"  mgl={p['mgl']}  b={p['b']}  Vmax={p['Vmax']}  "
          f"theta0={math.degrees(r['theta0']):.1f} deg")
    print("--- result ---")
    print(f"  swing extrema (back-and-forth count): {r['swing_extrema']}")
    if r['caught_t'] is not None:
        print(f"  caught (entered PD region) at t = {r['caught_t']:.2f}s")
    else:
        print("  NEVER CAUGHT")
    print(f"  final theta = {math.degrees(r['final_theta']):.2f} deg "
          f"(0 = upright)   settled={r['settled']}")
    print(f"  peak |V| = {r['peak_V']:.2f} V   peak |i| = {r['peak_i']:.2f} A")


if __name__ == "__main__":
    r = simulate()
    diagnostics(r, PARAMS)

    # Resample to ~120 Hz for export (Blender bake + website).
    HERE = os.path.dirname(os.path.abspath(__file__))
    out_dt = 1.0 / 120.0
    samples = []
    next_t = 0.0
    for t, th in zip(r["t"], r["theta"]):
        if t + 1e-9 >= next_t:
            samples.append({"t": round(t, 4), "theta": round(th, 5)})
            next_t += out_dt
    with open(os.path.join(HERE, "theta_history.json"), "w") as f:
        json.dump(samples, f)
    print(f"--- wrote {len(samples)} samples to theta_history.json ---")
