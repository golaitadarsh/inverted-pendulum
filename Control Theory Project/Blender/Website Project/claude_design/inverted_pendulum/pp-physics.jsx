// Inverted pendulum physics — simple rotational model.
// State: θ = angle FROM UPRIGHT (0 = balanced, π = hanging down).
//        ω = θ̇ (angular velocity, rad/s).
//
// Dynamics (single-link, motor torque):
//   J θ̈ + b θ̇  =  τ + m g L sin(θ)
//      (gravity pushes AWAY from upright when |θ|>0)
//
// PD stabilizer near upright:  τ = -Kp θ - Kd θ̇
// Swing-up far from upright:    energy-pump · sgn(θ̇ cos θ) clamped to Vmax
//
// All values are demo-scaled, not the real lab rig.

const PHYS = {
  J: 0.0095,    // moment of inertia (kg·m²)
  m: 0.18,      // bob mass (kg)
  L: 0.30,      // rod length to bob (m)
  g: 9.81,      // gravity
  b: 0.012,     // viscous damping
  Vmax: 1.4,    // swing-up torque cap (N·m)
  Kp: 196,      // PD position gain
  Kd: 28,       // PD velocity gain
  taumax: 6,    // motor torque saturation (N·m)
  catchAngle: 0.55,  // |θ| below which PD takes over (rad)
};

function wrap(a) {
  // wrap to (-π, π]
  let x = a;
  while (x >  Math.PI) x -= 2*Math.PI;
  while (x <= -Math.PI) x += 2*Math.PI;
  return x;
}

function controlTorque(state, p, mode) {
  const theta = wrap(state.theta);
  const omega = state.omega;
  let tau = 0;
  let region = 'idle';

  if (mode === 'off') return { tau: 0, region: 'off' };

  if (Math.abs(theta) < p.catchAngle) {
    // Linear PD around upright
    tau = -p.Kp * theta - p.Kd * omega;
    region = 'pd';
  } else if (mode === 'swing') {
    // Energy-shaping swing-up:
    //   E = ½ J ω² + m g L (cos θ - 1)  (E_top = 0)
    // Pump in proportion to error from E_top, sign by ω cos θ.
    const E    = 0.5 * p.J * omega*omega + p.m * p.g * p.L * (Math.cos(theta) - 1);
    const Eerr = -E; // we want to drive E → 0
    const pump = 5.0 * Eerr * Math.sign(omega * Math.cos(theta));
    tau = Math.max(-p.Vmax, Math.min(p.Vmax, pump));
    region = 'swingup';
  }
  // saturate motor
  tau = Math.max(-p.taumax, Math.min(p.taumax, tau));
  return { tau, region };
}

function rhs(state, tau, p) {
  // θ̈ = (m g L sin θ - b ω + τ) / J
  const theta = state.theta;
  const omega = state.omega;
  const ddtheta = (p.m * p.g * p.L * Math.sin(theta) - p.b * omega + tau) / p.J;
  return { dtheta: omega, domega: ddtheta };
}

function step(state, dt, p, mode) {
  // RK4 with a single torque sample (fast & stable enough for demo)
  const { tau, region } = controlTorque(state, p, mode);

  const k1 = rhs(state, tau, p);
  const s2 = { theta: state.theta + 0.5*dt*k1.dtheta, omega: state.omega + 0.5*dt*k1.domega };
  const k2 = rhs(s2, tau, p);
  const s3 = { theta: state.theta + 0.5*dt*k2.dtheta, omega: state.omega + 0.5*dt*k2.domega };
  const k3 = rhs(s3, tau, p);
  const s4 = { theta: state.theta + dt*k3.dtheta, omega: state.omega + dt*k3.domega };
  const k4 = rhs(s4, tau, p);

  const dtheta = (k1.dtheta + 2*k2.dtheta + 2*k3.dtheta + k4.dtheta) / 6;
  const domega = (k1.domega + 2*k2.domega + 2*k3.domega + k4.domega) / 6;

  return {
    theta: state.theta + dt*dtheta,
    omega: state.omega + dt*domega,
    tau,
    region,
  };
}

// Simulation runner — keeps fixed-dt physics behind a render frame.
function makeSim(initial) {
  let state = { theta: initial?.theta ?? (Math.PI - 0.01), omega: initial?.omega ?? 0 };
  let mode = 'swing'; // 'swing' | 'off'
  let history = []; // [{t, theta, omega, tau}]
  let t = 0;
  let lastTau = 0;
  let lastRegion = 'idle';
  const dt = 0.001;

  return {
    get state() { return state; },
    get t() { return t; },
    get tau() { return lastTau; },
    get region() { return lastRegion; },
    setMode(m) { mode = m; },
    perturb(d_omega) {
      state = { ...state, omega: state.omega + d_omega };
    },
    nudgeAngle(d_theta) {
      state = { ...state, theta: state.theta + d_theta };
    },
    reset() {
      state = { theta: Math.PI - 0.01, omega: 0 };
      history = [];
      t = 0;
    },
    catch() {
      state = { theta: 0.001, omega: 0 };
    },
    /** Advance physics by realDt seconds (capped). Returns post-step state. */
    advance(realDt) {
      const cap = Math.min(realDt, 0.05);
      const n = Math.max(1, Math.round(cap / dt));
      for (let i = 0; i < n; i++) {
        const r = step(state, dt, PHYS, mode);
        state = { theta: r.theta, omega: r.omega };
        lastTau = r.tau;
        lastRegion = r.region;
        t += dt;
        // sample to history every ms (record raw)
        history.push({ t, theta: wrap(state.theta), omega: state.omega, tau: r.tau });
      }
      // keep last ~6 seconds
      const cutoff = t - 6;
      while (history.length && history[0].t < cutoff) history.shift();
      return state;
    },
    get history() { return history; },
  };
}

Object.assign(window, { PHYS, wrap, step, makeSim });
