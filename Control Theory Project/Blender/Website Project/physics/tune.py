"""Refine (K, Vmax) for a graceful ~6-14 swing energy-efficient pump + catch + settle."""
import copy, math
from pendulum_sim import PARAMS, simulate

Ks = [0.05, 0.06, 0.07, 0.08, 0.10]
vmaxs = [5.0, 6.0, 7.0, 8.0, 9.0]
b = 0.003

print(f"{'K':>6} {'Vmax':>6} {'th0deg':>7} {'swings':>7} {'caught_s':>9} "
      f"{'final_deg':>10} {'settled':>8} {'pkI':>6}")
best = []
for K in Ks:
    for vmax in vmaxs:
        p = copy.deepcopy(PARAMS); p["K"] = K; p["Vmax"] = vmax; p["b"] = b
        r = simulate(p, t_end=25.0)
        caught = f"{r['caught_t']:.2f}" if r["caught_t"] else "NEVER"
        mark = ""
        if r["settled"] and r["caught_t"] and 6 <= r["swing_extrema"] <= 18:
            mark = "  <== candidate"; best.append((K, vmax, r))
        print(f"{K:>6.2f} {vmax:>6.1f} {math.degrees(r['theta0']):>7.1f} "
              f"{r['swing_extrema']:>7d} {caught:>9} "
              f"{math.degrees(r['final_theta']):>10.1f} {str(r['settled']):>8} "
              f"{r['peak_i']:>6.2f}{mark}")
