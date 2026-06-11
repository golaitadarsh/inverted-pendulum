# Integration — using the rendered MP4

Once `walkthrough.mp4` is rendered, here's where to plug it in:

## Option A — replace the loader screen of the live demo (recommended)

The prototype currently boots into a synthetic "BOOTING, quietly." loader with a fake progress bar. Replace that with the rendered video playing through, then auto-advance to the live interactive demo.

In `pp-app.jsx`, swap the `<Loader>` component for:

```jsx
function VideoLoader({ onDone }) {
  return (
    <video
      src="walkthrough.mp4"
      autoPlay muted playsInline
      onEnded={onDone}
      style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', background:'#0E0E0C' }}
    />
  );
}
```

The video already contains the LAB block, mode pills, and badges as overlays, so it lands in the same visual frame as the live demo when it finishes.

## Option B — hero loop on portfolio

If you want a looping hero on your portfolio's project card (before user clicks in):

- Trim `walkthrough.mp4` to a 6-second loop: take frames 420–600 (the balancing + perturbation + recovery sequence) — it's the most visually compelling segment, and loops cleanly because pendulum is balanced at both ends.
- Encode as autoplay-safe WebM: `ffmpeg -i walkthrough.mp4 -ss 14 -t 6 -an -c:v libvpx-vp9 -crf 32 -b:v 0 hero.webm`
- Use `<video autoplay muted loop playsinline poster="hero.jpg">`.

## Option C — OG card preview

The OG card (1200×630) is just a single frame from the video. Frame 600 (start of Studio) gives you the most striking still: balanced rod + bracket chrome + the about-to-appear Studio panels.

```
ffmpeg -ss 20 -i walkthrough.mp4 -frames:v 1 -vf "scale=1200:630" og-card.jpg
```

## Option D — standalone case study

Embed the video on the project's case-study page with a `<details>` toggle that flips between the rendered walkthrough and the live interactive build. Captions per scene from `STORYBOARD.md` make solid alt-text and provide an a11y-friendly path for users who can't see motion.

## Hand-back checklist

When you deliver the video back to the user, attach:

- [ ] `walkthrough.mp4` (30s, ≤30 MB, H.264 CRF ~20)
- [ ] `hero.webm` if Option B chosen
- [ ] `og-card.jpg` (1200×630)
- [ ] `frame-600.png` (favicon source — crop center 256×256, then downsample to 32×32)
- [ ] A short Loom/Notion note confirming the pendulum motion in the video matches `theta_history.json` to within 1 frame
