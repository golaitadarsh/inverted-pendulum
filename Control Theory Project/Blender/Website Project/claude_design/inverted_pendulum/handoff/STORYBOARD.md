# Storyboard — Inverted Pendulum walkthrough

**Total: 30s · 1920×1080 · 30fps · 900 frames**

Three scenes, three modes. No hard cuts — every transition is a camera move or a panel slide. The pendulum keeps moving through the entire video; the camera and overlays do the storytelling.

---

## Scene 1 · KIT — `00:00 – 00:08` (frames 0–240)

**Aesthetic**: top-down orthographic camera, cutting-mat ground plane, parts splayed out in their exploded positions. Single warm-cool key light. Long shadows under each part.

| t (s) | frame | beat |
|---:|---:|---|
| 0.00 | 0 | Black frame. |
| 0.10 | 3 | `[ LAB / 04 ] — 2026 · v0.1` fades up top-left over 200 ms. |
| 0.40 | 12 | `PENDULUM.` (Geist 900) types/cuts in. Beside it: `inverted.` (Instrument Serif italic, acid green) on a 100 ms delay. |
| 0.80 | 24 | Camera reveals: top-down ortho on cutting-mat plane, all 8 parts laid out in exploded positions. Soft crosshair ticks at the four corners (overlay). |
| 1.00 | 30 | Bottom-center mode pills appear: `[ KIT ]` active, `[ RUN ]` `[ STUDIO ]` dim. |
| 1.20 | 36 | Bottom-left badge: `[ 01 ]  — KIT.` |
| 1.50 | 45 | First part isolates: `arduino_uno` lifts 5 mm and is rimmed by an acid spotlight; everything else dims to 30% emission. Label callout appears beside it: `[ 01 ] · ARDUINO UNO` + `CONTROLLER · ATMEGA328P · 16 MHZ`. **Hold 600 ms**. |
| 2.10 | 63 | Same treatment cycles to the next part. Order: `arduino_uno → motor_driver_PCB (on breadboard if no separate object — confirm) → motor → encoder → rod-or-mass → mass → base_support_stand+motor_support_stand+encoder_support_stand (grouped as STANDS ×3) → 12V_10A`. Each part: 600 ms hold, 100 ms transition. |
| 7.00 | 210 | Last part fades. All parts return to full emission. Camera **starts** an 800 ms ease-out tilt from top-down (90°) toward 35° pitch. |
| 7.80 | 234 | Camera mid-tilt. Mode pills crossfade: `[ KIT ]` → `[ RUN ]` becomes active. Badge swaps `[ 01 ] KIT.` → `[ 02 ] RUN.` |
| 8.00 | 240 | End of scene 1. Camera at 35° pitch, mid-distance. Parts still in exploded positions. |

---

## Scene 2 · RUN — `00:08 – 00:20` (frames 240–600)

**Aesthetic**: 3/4 side view, parts assemble, pendulum swings up, PD balances. This is the longest scene because the swing-up + balance IS the demo.

| t (s) | frame | beat |
|---:|---:|---|
| 8.00 | 240 | Parts in exploded positions. |
| 8.10 | 243 | **Assembly**: every part keyframes from its exploded location to its final assembled position over 800 ms, ease-out. Stands plant first, then motor/encoder mount, then rod attaches, then bob caps the rod. Stagger the start of each by 60 ms for a satisfying chain. |
| 8.90 | 267 | Rig fully assembled. Pendulum at θ = π (hanging straight down — rod points DOWN from pivot). Hold 200 ms. |
| 9.10 | 273 | **Swing-up begins.** Drive `mass`'s rotation (or rod-pivot rotation if rod is separate) from `theta_history.json`. The JSON contains (t, theta) samples from the live JS sim — energy-shaping swing-up takes ~4–5 seconds in the sim, so the rod oscillates with growing amplitude. |
| 9.10–14.00 | 273–420 | Camera slowly pushes in 8% during swing-up. Subtle. HUD overlay top-right shows live `θ = …` updating from the same JSON. |
| 14.00 | 420 | **Catch.** θ crosses 0 with low |θ̇|; PD region takes over. Visual: bob briefly tints acid green (animate `mass`'s emission shader for 200 ms then back). State chip overlay flips to `STATE · BALANCING` in acid. |
| 14.20–17.00 | 426–510 | **Hold balance.** Pendulum stays near θ ≈ 0 with tiny corrections. Camera holds. |
| 17.00 | 510 | **Perturbation pulse.** A 0.5 N·m external impulse hits — animate a brief horizontal jolt on the bob (translate `mass` 8 mm in +X over 60 ms then release; PD corrects via the JSON-driven motion). HUD shows torque bar swinging. |
| 17.50–19.50 | 525–585 | PD recovers. Pendulum returns to upright over ~1.5s. |
| 19.50–20.00 | 585–600 | Hold balance. Camera does a slow 4% dolly-in on the rod tip. Mode pills crossfade `[ RUN ]` → `[ STUDIO ]`. Badge swaps. |
| 20.00 | 600 | End of scene 2. |

---

## Scene 3 · STUDIO — `00:20 – 00:30` (frames 600–900)

**Aesthetic**: cinematic. Background dims, panels slide in over the still-balancing rig. Diagram → Plots → Math, then end.

| t (s) | frame | beat |
|---:|---:|---|
| 20.00 | 600 | Camera holds. Scene world emission dims to 42% over 300 ms. Pendulum keeps balancing in background. |
| 20.40 | 612 | Sub-pills appear (overlay): `[ D · DIAGRAM ]` `[ P · PLOTS ]` `[ M · MATH ]`. D active. |
| 20.60 | 618 | **Diagram panel** slides up from y+18px to y+0, opacity 0→1, 220 ms ease-out. Shows the full-cascade block diagram: `r(t) → POSITION CTRL → CURRENT CTRL → PLANT`. Last block (PLANT) outlined in acid. Signal dictionary below. |
| 20.82–23.00 | 624–690 | Hold on Diagram panel. |
| 23.00 | 690 | Diagram panel fades out (180 ms), Plots panel fades in (180 ms, 60 ms overlap). Sub-pill active state moves to P. |
| 23.18–25.50 | 695–765 | Hold on Plots panel: pole-zero map (3 poles, +0.01 in acid) + live θ(t) trace + 4 KPI tiles (settle 0.84 s · overshoot 12 % · ITAE 0.31 · phase margin 42° in acid). |
| 25.50 | 765 | Crossfade Plots → Math. Sub-pill to M. |
| 25.68–28.50 | 770–855 | Hold on Math panel: Plant `J θ̈ + b θ̇ = K·i + m g L sin(θ)` · Destabilizer `V = V_max · sgn(θ̇)` · PD `θ̈_c = −K_p·θ − K_d·θ̇` · gains/poles. Italic serif equations. |
| 28.50 | 855 | Math panel slides away (220 ms). Background returns to full emission (300 ms). Sub-pills fade out. |
| 28.80 | 864 | Hold on balanced rig. Camera does one final 2% push-in. |
| 29.30 | 879 | Italic serif text fades up over the lower third: `balance is a state.` (Instrument Serif italic, acid green, 56pt). |
| 29.90 | 897 | Text holds. |
| 30.00 | 900 | End. |

---

## Audio (optional, off by default)

If the user asks for audio:
- Single 50 Hz mains-hum bed at -36 dB through the whole video.
- One soft motor-spool tick at frame 273 (swing-up start) at -24 dB.
- One brief impulse "thud" at frame 510 (perturbation).
- Nothing else. No music.

## Render targets to verify before final

- [ ] Pendulum motion in the rendered video matches `theta_history.json` to within 1 frame.
- [ ] Acid green appears only as: bob highlight on PD catch, KIT/PLANT outlines, the `inverted.` accent text, the +0.01 pole, phase margin tile, and the closing line. Never as bulk fill.
- [ ] Bracket-corner chrome is present on every overlay panel.
- [ ] No frame is fully black except frame 0.
- [ ] Total file size ≤ 30 MB (H.264, CRF 20).
