// Mode screens — Kit / Run / Studio (Diagram/Plots/Math) + Loader.
// Pure presentational + interaction; physics lives in pp-physics.jsx.

const { useState, useEffect, useRef, useMemo } = React;

// ─── helpers ──────────────────────────────────────────────────────────────────
function useAnimationFrame(cb, deps = []) {
  const ref = useRef();
  useEffect(() => {
    let raf, last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      cb(dt, now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line
  }, deps);
}

// ─── LOADER ───────────────────────────────────────────────────────────────────
function Loader({ onDone, accent }) {
  const [pct, setPct] = useState(0);
  const [drawn, setDrawn] = useState(0);
  const assets = [
    { name: 'KIT.GLB',     bytes: '1.2MB',  weight: 25 },
    { name: 'ROD.GLB',     bytes: '184KB',  weight: 8 },
    { name: 'ENCODER.GLB', bytes: '92KB',   weight: 6 },
    { name: 'MAT.PNG',     bytes: '440KB',  weight: 15 },
    { name: 'PLOTS.JSON',  bytes: '12KB',   weight: 8 },
    { name: 'SHADER.GLSL', bytes: '4KB',    weight: 8 },
    { name: 'SIM.WASM',    bytes: '128KB',  weight: 18 },
    { name: 'POSES.JSON',  bytes: '6KB',    weight: 12 },
  ];

  useEffect(() => {
    let p = 0;
    const tick = () => {
      // ease-out increments
      const remaining = 100 - p;
      p += Math.max(0.4, remaining * 0.035 + Math.random() * 1.2);
      if (p >= 100) { p = 100; setPct(100); setTimeout(onDone, 480); return; }
      setPct(p);
      setTimeout(tick, 60 + Math.random()*80);
    };
    tick();
  }, []);

  // pole-zero draw-in based on pct
  useEffect(() => { setDrawn(pct / 100); }, [pct]);

  // mark assets done as pct crosses thresholds
  let acc = 0;
  const totals = assets.map(a => (acc += a.weight));
  const doneCount = totals.filter(t => t <= pct).length;
  const currentI = Math.min(doneCount, assets.length - 1);

  return (
    <div className="mat-d" style={{ position:'absolute', inset:0, color: 'var(--ink-on-lab)' }}>
      <div className="brackets" style={{ color: 'var(--ink-on-lab)' }}><i className="br-tr"/><i className="br-br"/></div>

      {/* top-left LAB title */}
      <div style={{ position:'absolute', top: 28, left: 32 }}>
        <div className="mono-cap-sm" style={{ color: 'var(--mut-d)' }}>[ LAB / 04 ] · BOOTING</div>
        <div style={{ fontFamily:'var(--display)', fontWeight: 900, fontSize: 22, marginTop: 2 }}>PENDULUM.</div>
      </div>
      <div style={{ position:'absolute', top: 28, right: 32, textAlign:'right' }} className="mono-cap-sm" >
        <div style={{ color:'var(--mut-d)' }}>v0.1 · 2026</div>
        <div style={{ color:'var(--fnt-d)', marginTop:2 }}>STAND BY · {Math.floor(pct).toString().padStart(3,'0')}%</div>
      </div>

      {/* Center: huge italic + progress bar */}
      <div style={{ position:'absolute', top:'42%', left:'50%', transform:'translate(-50%,-50%)', width: 720, maxWidth:'80vw' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap: 14 }}>
          <span style={{ fontFamily:'var(--display)', fontWeight: 900, fontSize: 96, lineHeight:.9, letterSpacing:'-.025em' }}>BOOTING,</span>
          <span className="serif-i" style={{ fontSize: 80, lineHeight:.9, color: accent, letterSpacing:'-.01em' }}>quietly.</span>
        </div>
        <div style={{ marginTop: 30 }}>
          <div className="prog-track"><div className="prog-fill" style={{ width: pct + '%', background: accent }}/></div>
          <div style={{ marginTop: 10, display:'flex', justifyContent:'space-between' }} className="mono-cap-sm">
            <span style={{ color:'var(--mut-d)' }}>LOADING ASSETS</span>
            <span style={{ color:'var(--mut-d)' }}>{(pct/100).toFixed(2)} / 1.00</span>
          </div>
        </div>
      </div>

      {/* Bottom-left manifest */}
      <div style={{ position:'absolute', bottom: 60, left: 32, width: 280 }}>
        <div className="mono-cap-sm" style={{ color:'var(--mut-d)', marginBottom: 8 }}>MANIFEST</div>
        {assets.map((a, i) => {
          const isDone = i < doneCount;
          const isActive = i === doneCount && doneCount < assets.length;
          const color = isDone ? 'var(--mut-d)' : isActive ? accent : 'var(--fnt-d)';
          const mark  = isDone ? '✓' : isActive ? '↳' : '·';
          return (
            <div key={a.name} style={{ display:'flex', justifyContent:'space-between', fontFamily:'var(--mono)', fontSize: 10, color, lineHeight: 1.65 }}>
              <span>{mark} &nbsp; {a.name}</span>
              <span>{a.bytes}</span>
            </div>
          );
        })}
      </div>

      {/* Bottom-right pole-zero drawing in */}
      <div style={{ position:'absolute', bottom: 60, right: 32, width: 280 }}>
        <div className="mono-cap-sm" style={{ color:'var(--mut-d)', marginBottom: 8, textAlign:'right' }}>OPEN-LOOP POLES</div>
        <svg viewBox="0 0 280 160" style={{ width:'100%' }}>
          <defs>
            <pattern id="lg" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0H0V20" fill="none" stroke="rgba(244,241,232,.08)" strokeWidth=".5"/>
            </pattern>
          </defs>
          <rect width="280" height="160" fill="url(#lg)"/>
          <line x1="0" y1="80" x2="280" y2="80" stroke="var(--mut-d)" strokeWidth=".75"/>
          <line x1="170" y1="0" x2="170" y2="160" stroke="var(--mut-d)" strokeWidth=".75"/>
          {/* poles with progressive draw */}
          {[
            { x: 40,  c: 'var(--ink-on-lab)', label:'−14.27', th: 0.15 },
            { x: 110, c: 'var(--ink-on-lab)', label:'−2.94',  th: 0.55 },
            { x: 176, c: accent,              label:'+0.01',  th: 0.85, accent:true },
          ].map((p, i) => {
            const visible = drawn > p.th;
            const ratio = Math.max(0, Math.min(1, (drawn - p.th) / 0.12));
            return visible ? (
              <g key={i} stroke={p.c} strokeWidth={p.accent ? 1.8 : 1.4} opacity={ratio}>
                <line x1={p.x-5} y1={75} x2={p.x+5*ratio} y2={85} />
                <line x1={p.x-5} y1={85} x2={p.x+5*ratio} y2={75} />
              </g>
            ) : null;
          })}
          <text x="6"   y="156" fontFamily="Geist Mono" fontSize="8" fill="var(--fnt-d)">Re(s)</text>
          <text x="174" y="10"  fontFamily="Geist Mono" fontSize="8" fill="var(--fnt-d)">Im(s)</text>
        </svg>
        <div className="mono-cap-sm" style={{ color: pct > 88 ? accent : 'var(--fnt-d)', marginTop: 6, textAlign:'right' }}>
          {pct > 88 ? '↳ THIRD POLE UNSTABLE' : '↳ AWAITING SOLVE…'}
        </div>
      </div>

      <div style={{ position:'absolute', bottom: 24, left: 32, right: 32, display:'flex', justifyContent:'space-between' }} className="mono-cap-sm">
        <span style={{ color:'var(--fnt-d)' }}>↳ AUTO-ENTER · KIT</span>
        <span style={{ color:'var(--fnt-d)' }}>PRESS [SPACE] TO SKIP</span>
      </div>
    </div>
  );
}

// ─── KIT — exploded hardware view ─────────────────────────────────────────────
const KIT_PARTS = [
  { id: 'uno',  num: '01', label: 'ARDUINO UNO',  desc: 'CONTROLLER · ATMEGA328P · 16 MHZ' },
  { id: 'drv',  num: '02', label: 'MOTOR DRIVER', desc: 'BTS7960 · 43A H-BRIDGE · PWM' },
  { id: 'mot',  num: '03', label: 'MOTOR RS-775', desc: 'DC · 12V · 12000 RPM NO-LOAD' },
  { id: 'enc',  num: '04', label: 'OPTICAL ENC',  desc: '4096 PPR · QUADRATURE' },
  { id: 'rod',  num: '05', label: 'PENDULUM ROD', desc: 'ALUMINIUM · L = 300 MM · Ø 8 MM' },
  { id: 'bob',  num: '06', label: 'BOB',          desc: 'STAINLESS STEEL · 180 G' },
  { id: 'std',  num: '07', label: 'STANDS ×2',    desc: '2020 ALU PROFILE · 400 MM' },
  { id: 'psu',  num: '08', label: '12V BRICK',    desc: '60W · LM2596 BUCK · 5A' },
];

// Tiny inline svg "icon" per part — abstract block silhouettes
function PartGlyph({ id, accent, color }) {
  const stroke = color, fill = 'none', sw = 1.4;
  const props = { fill, stroke, strokeWidth: sw, strokeLinejoin: 'round', strokeLinecap: 'round' };
  switch (id) {
    case 'uno': return (<svg viewBox="0 0 80 60" width="100%" height="100%"><rect x="6" y="10" width="68" height="40" {...props}/><rect x="10" y="14" width="16" height="6" {...props}/><rect x="48" y="14" width="22" height="6" {...props}/><circle cx="64" cy="40" r="3" {...props}/><circle cx="56" cy="40" r="3" {...props}/></svg>);
    case 'drv': return (<svg viewBox="0 0 80 60" width="100%" height="100%"><rect x="10" y="14" width="60" height="32" {...props}/><rect x="14" y="18" width="20" height="24" {...props}/><line x1="40" y1="18" x2="40" y2="42" {...props}/><line x1="48" y1="22" x2="64" y2="22" {...props}/><line x1="48" y1="30" x2="64" y2="30" {...props}/><line x1="48" y1="38" x2="64" y2="38" {...props}/></svg>);
    case 'mot': return (<svg viewBox="0 0 80 60" width="100%" height="100%"><rect x="14" y="14" width="48" height="32" rx="3" {...props}/><line x1="62" y1="30" x2="72" y2="30" {...props} strokeWidth={sw*1.5}/><circle cx="38" cy="30" r="8" {...props}/></svg>);
    case 'enc': return (<svg viewBox="0 0 80 60" width="100%" height="100%"><circle cx="40" cy="30" r="18" {...props}/><circle cx="40" cy="30" r="3" fill={accent} stroke="none"/>{[0,1,2,3,4,5,6,7].map(i => { const a = i * Math.PI/4; return <line key={i} x1={40 + Math.cos(a)*8} y1={30 + Math.sin(a)*8} x2={40 + Math.cos(a)*15} y2={30 + Math.sin(a)*15} {...props}/>; })}</svg>);
    case 'rod': return (<svg viewBox="0 0 80 60" width="100%" height="100%"><line x1="10" y1="30" x2="70" y2="30" {...props} strokeWidth={sw*2}/><circle cx="10" cy="30" r="2.5" fill={color} stroke="none"/><circle cx="70" cy="30" r="2.5" fill={color} stroke="none"/></svg>);
    case 'bob': return (<svg viewBox="0 0 80 60" width="100%" height="100%"><circle cx="40" cy="30" r="14" {...props}/><circle cx="40" cy="30" r="6" fill={accent} stroke="none"/></svg>);
    case 'std': return (<svg viewBox="0 0 80 60" width="100%" height="100%"><rect x="20" y="6" width="8" height="48" {...props}/><rect x="52" y="6" width="8" height="48" {...props}/><line x1="20" y1="30" x2="60" y2="30" {...props} strokeDasharray="2 3"/></svg>);
    case 'psu': return (<svg viewBox="0 0 80 60" width="100%" height="100%"><rect x="10" y="16" width="50" height="28" rx="2" {...props}/><line x1="60" y1="24" x2="70" y2="24" {...props}/><line x1="60" y1="36" x2="70" y2="36" {...props}/><text x="16" y="35" fontFamily="Geist Mono" fontSize="9" fill={color}>12V</text></svg>);
    default: return null;
  }
}

function Kit({ accent, light }) {
  const [hover, setHover] = useState(null);
  const ink = light ? 'var(--ink-on-bone)' : 'var(--ink-on-lab)';
  const mut = light ? 'var(--mut-l)' : 'var(--mut-d)';
  const fnt = light ? 'var(--fnt-l)' : 'var(--fnt-d)';
  const hair = light ? 'var(--hair-l)' : 'var(--hair-d)';
  const inkRGB = light ? '#0A0A08' : '#F4F1E8';
  const mat = light ? 'mat-l' : 'mat-d';

  return (
    <div className={`${mat}`} style={{ position:'absolute', inset:0, color: ink }}>
      {/* Header strip */}
      <div style={{ position:'absolute', top: 130, left: 32, right: 32, display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
        <div>
          <div className="mono-cap-sm" style={{ color: mut }}>[ 01 ] · KIT · EXPLODED HARDWARE</div>
          <div style={{ display:'flex', alignItems:'baseline', gap: 12, marginTop: 6 }}>
            <span style={{ fontFamily:'var(--display)', fontWeight: 900, fontSize: 40, letterSpacing:'-.02em' }}>EIGHT PARTS.</span>
            <span className="serif-i" style={{ fontSize: 36, color: accent, lineHeight: 1, letterSpacing:'-.005em' }}>one unstable equilibrium.</span>
          </div>
        </div>
        <div className="mono-cap-sm" style={{ color: fnt, textAlign:'right', maxWidth: 240 }}>↳ HOVER A TILE TO ISOLATE<br/>↳ NEXT · PRESS [ 2 ] FOR RUN</div>
      </div>

      {/* Parts grid — 4 cols × 2 rows */}
      <div style={{ position:'absolute', top: 235, left: 32, right: 32, bottom: 110, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gridTemplateRows:'1fr 1fr', gap: 18 }}>
        {KIT_PARTS.map(p => {
          const isHover = hover === p.id;
          const dim = !!hover && !isHover;
          return (
            <div key={p.id}
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover(null)}
              style={{
                position:'relative',
                border: `1px solid ${isHover ? accent : hair}`,
                background: isHover ? (light ? 'rgba(10,10,8,.04)' : 'rgba(244,241,232,.04)') : 'transparent',
                padding: 18,
                opacity: dim ? .28 : 1,
                transition: 'opacity .22s ease, border-color .15s ease, background .15s ease',
                cursor: 'pointer',
                display:'flex', flexDirection:'column',
                overflow:'hidden',
              }}>
              {/* corner brackets */}
              <span style={{ position:'absolute', top:0, left:0, width: 10, height: 10, borderTop: `1px solid ${isHover ? accent : inkRGB}`, borderLeft: `1px solid ${isHover ? accent : inkRGB}` }}/>
              <span style={{ position:'absolute', top:0, right:0, width: 10, height: 10, borderTop: `1px solid ${isHover ? accent : inkRGB}`, borderRight: `1px solid ${isHover ? accent : inkRGB}` }}/>
              <span style={{ position:'absolute', bottom:0, left:0, width: 10, height: 10, borderBottom: `1px solid ${isHover ? accent : inkRGB}`, borderLeft: `1px solid ${isHover ? accent : inkRGB}` }}/>
              <span style={{ position:'absolute', bottom:0, right:0, width: 10, height: 10, borderBottom: `1px solid ${isHover ? accent : inkRGB}`, borderRight: `1px solid ${isHover ? accent : inkRGB}` }}/>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <span className="mono-cap" style={{ color: isHover ? accent : mut, fontSize: 14, letterSpacing:'.16em' }}>[ {p.num} ]</span>
                <span className="mono-cap-sm" style={{ color: fnt }}>{isHover ? '←' : '·'}</span>
              </div>

              {/* glyph */}
              <div style={{ flex: 1, display:'flex', alignItems:'center', justifyContent:'center', padding: '10px 14px' }}>
                <div style={{ width:'100%', maxWidth: 140, color: isHover ? accent : inkRGB }}>
                  <PartGlyph id={p.id} accent={accent} color={isHover ? accent : inkRGB}/>
                </div>
              </div>

              <div>
                <div style={{ fontFamily:'var(--mono)', fontSize: 11, color: ink, letterSpacing:'.04em' }}>{p.label}</div>
                <div style={{ fontFamily:'var(--mono)', fontSize: 9, color: mut, letterSpacing:'.06em', marginTop: 3 }}>{p.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── RUN — live sim canvas + HUD ──────────────────────────────────────────────
function RunCanvas({ sim, accent, light, perturbing, onClickPerturb }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const dpr = window.devicePixelRatio || 1;

  // Single render loop. Each frame we read wrap's size and resize canvas in
  // place if needed. No useState/useLayoutEffect dance — those caused render
  // storms when mounted inside Studio's dimmed-canvas slot.
  useEffect(() => {
    let raf;
    const draw = () => {
      const c = canvasRef.current, wrap = wrapRef.current;
      if (!c || !wrap) { raf = requestAnimationFrame(draw); return; }
      const rect = wrap.getBoundingClientRect();
      const wantW = Math.max(2, Math.round(rect.width  * dpr));
      const wantH = Math.max(2, Math.round(rect.height * dpr));
      if (c.width  !== wantW) c.width  = wantW;
      if (c.height !== wantH) c.height = wantH;
      const wPx = rect.width + 'px', hPx = rect.height + 'px';
      if (c.style.width  !== wPx) c.style.width  = wPx;
      if (c.style.height !== hPx) c.style.height = hPx;

      const ctx = c.getContext('2d');
      const W = c.width, H = c.height;
      ctx.clearRect(0, 0, W, H);

      ctx.save();
      ctx.scale(dpr, dpr);
      const w = W / dpr, h = H / dpr;
      const cx = w * 0.5;
      const groundY = h * 0.66;

      // ground hairline
      ctx.strokeStyle = light ? 'rgba(10,10,8,.30)' : 'rgba(244,241,232,.32)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke();

      // ground ticks
      ctx.strokeStyle = light ? 'rgba(10,10,8,.16)' : 'rgba(244,241,232,.16)';
      for (let x = 0; x < w; x += 24) {
        ctx.beginPath(); ctx.moveTo(x, groundY); ctx.lineTo(x, groundY + 6); ctx.stroke();
      }

      // base / motor block
      const baseW = 90, baseH = 32;
      ctx.fillStyle = light ? '#0A0A08' : '#F4F1E8';
      ctx.fillRect(cx - baseW/2, groundY - baseH, baseW, baseH);
      // pivot dot (top center of base)
      const pivX = cx, pivY = groundY - baseH;
      ctx.fillStyle = accent;
      ctx.beginPath(); ctx.arc(pivX, pivY, 4, 0, Math.PI*2); ctx.fill();

      // pendulum
      const L_px = Math.min(w, h) * 0.34;
      const theta = sim.state.theta; // 0 = upright
      // We draw with screen-up = upright. In screen coords, upright is -y.
      // Position of bob: pivot + (sin θ, -cos θ) * L
      const bobX = pivX + Math.sin(theta) * L_px;
      const bobY = pivY - Math.cos(theta) * L_px;

      ctx.strokeStyle = light ? '#0A0A08' : '#F4F1E8';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pivX, pivY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // bob
      const bobR = 14;
      ctx.fillStyle = light ? '#0A0A08' : '#F4F1E8';
      ctx.beginPath(); ctx.arc(bobX, bobY, bobR, 0, Math.PI*2); ctx.fill();
      // inner accent dot if PD active
      if (sim.region === 'pd') {
        ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(bobX, bobY, bobR - 6, 0, Math.PI*2); ctx.fill();
      }

      // torque arc indicator at base
      const tau = sim.tau;
      const tauNorm = Math.max(-1, Math.min(1, tau / PHYS.taumax));
      if (Math.abs(tauNorm) > 0.02) {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const arcR = baseW * 0.6;
        const start = -Math.PI/2;
        const end = start + tauNorm * Math.PI * 0.4;
        ctx.arc(pivX, pivY, arcR, Math.min(start,end), Math.max(start,end));
        ctx.stroke();
        // arrowhead
        const aAng = end;
        const aX = pivX + Math.cos(aAng) * arcR;
        const aY = pivY + Math.sin(aAng) * arcR;
        ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(aX, aY, 3, 0, Math.PI*2); ctx.fill();
      }

      // angle protractor — dashed
      ctx.strokeStyle = light ? 'rgba(10,10,8,.18)' : 'rgba(244,241,232,.18)';
      ctx.setLineDash([2, 3]);
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.arc(pivX, pivY, L_px * 1.04, -Math.PI, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      // upright vertical guide
      ctx.beginPath();
      ctx.moveTo(pivX, pivY);
      ctx.lineTo(pivX, pivY - L_px * 1.08);
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = light ? 'rgba(10,10,8,.30)' : 'rgba(244,241,232,.30)';
      ctx.stroke();
      ctx.setLineDash([]);

      // θ label near pivot
      ctx.fillStyle = light ? 'var(--mut-l)' : 'rgba(244,241,232,.55)';
      ctx.font = '10px Geist Mono';
      ctx.fillText(`θ = ${(theta).toFixed(3)} rad`, pivX + 14, pivY - 14);

      // region / mode badge
      ctx.font = '9px Geist Mono';
      ctx.fillStyle = sim.region === 'pd' ? accent : (light ? 'rgba(10,10,8,.55)' : 'rgba(244,241,232,.55)');
      ctx.fillText(`[ ${sim.region.toUpperCase()} ]`, pivX - baseW/2, groundY + 22);

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [sim, accent, light, dpr]);

  // click → perturb
  const handleClick = (e) => {
    if (!onClickPerturb) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    // Map click X offset to angular impulse: clicking right pushes pendulum right
    const impulse = Math.max(-1, Math.min(1, x / (rect.width * 0.35))) * 6;
    onClickPerturb(impulse);
  };

  return (
    <div ref={wrapRef} onClick={handleClick} className={perturbing ? 'perturb-cursor' : ''} style={{ position:'absolute', inset: 0 }}>
      <canvas ref={canvasRef} style={{ position:'absolute', inset:0, display:'block' }}/>
    </div>
  );
}

function AngleDial({ theta, accent, light }) {
  // theta is angle from upright; clamp display to ±π
  const t = Math.max(-Math.PI, Math.min(Math.PI, theta));
  const startAng = -Math.PI/2 - Math.PI/2; // -180°
  const r = 40;
  const cx = 60, cy = 60;
  const needleAng = -Math.PI/2 + t;
  const nx = cx + Math.cos(needleAng) * r;
  const ny = cy + Math.sin(needleAng) * r;
  const ink = light ? 'rgba(10,10,8,.45)' : 'rgba(244,241,232,.45)';
  return (
    <svg viewBox="0 0 120 80" width="100%">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={ink} strokeWidth=".8"/>
      <line x1={cx} y1={cy - r - 4} x2={cx} y2={cy - r + 4} stroke={accent} strokeWidth="1.5"/>
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={light ? '#0A0A08' : '#F4F1E8'} strokeWidth="2"/>
      <circle cx={cx} cy={cy} r="2" fill={accent}/>
      <text x="0" y="76" fontFamily="Geist Mono" fontSize="8" fill={ink}>−π</text>
      <text x="106" y="76" fontFamily="Geist Mono" fontSize="8" fill={ink}>π</text>
      <text x="56" y="14" fontFamily="Geist Mono" fontSize="8" fill={accent}>0</text>
    </svg>
  );
}

function Bar({ v, max, label, accent, light, sub }) {
  const ratio = Math.max(-1, Math.min(1, v / max));
  const ink = light ? 'rgba(10,10,8,.14)' : 'rgba(244,241,232,.14)';
  const fg  = light ? '#0A0A08' : '#F4F1E8';
  return (
    <div>
      <div className="mono-cap-sm" style={{ color: light ? 'var(--mut-l)' : 'var(--mut-d)', display:'flex', justifyContent:'space-between' }}>
        <span>{label}</span><span>{v.toFixed(2)}{sub ? ' ' + sub : ''}</span>
      </div>
      <div style={{ height: 4, background: ink, position:'relative', marginTop: 6 }}>
        <div style={{
          position:'absolute', top: 0, height: '100%',
          left: ratio >= 0 ? '50%' : (50 + ratio * 50) + '%',
          width: Math.abs(ratio) * 50 + '%',
          background: ratio >= 0 ? fg : accent,
        }}/>
        <div style={{ position:'absolute', left:'50%', top:-2, width: 1, height: 8, background: light ? '#0A0A08' : '#F4F1E8' }}/>
      </div>
    </div>
  );
}

function Run({ sim, entering, accent, light }) {
  const [, force] = useState(0);
  const [torqueSet, setTorqueSet] = useState(0.4); // user-set impulse magnitude
  const [keys, setKeys] = useState({});
  const [stable, setStable] = useState(false);

  // poll sim state at render rate for display
  useEffect(() => {
    let raf;
    const tick = () => { force(x => x + 1); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // stability detection
  useEffect(() => {
    const id = setInterval(() => {
      const t = Math.abs(window.wrap(sim.state.theta));
      const w = Math.abs(sim.state.omega);
      setStable(t < 0.05 && w < 0.5);
    }, 100);
    return () => clearInterval(id);
  }, [sim]);

  // keyboard nudges
  useEffect(() => {
    const down = (e) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      setKeys(prev => ({ ...prev, [k]: true }));
      if (k === 'w') sim.perturb(-1.2 * torqueSet);
      else if (k === 's') sim.perturb( 1.2 * torqueSet);
      else if (k === 'a') sim.perturb(-2.4 * torqueSet);
      else if (k === 'd') sim.perturb( 2.4 * torqueSet);
      else if (k === 'r') sim.reset();
      else if (k === 'c') sim.catch();
    };
    const up = (e) => { setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false })); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [sim, torqueSet]);

  const mat = light ? 'mat-l' : 'mat-d';
  const ink = light ? 'var(--ink-on-bone)' : 'var(--ink-on-lab)';
  const mut = light ? 'var(--mut-l)' : 'var(--mut-d)';
  const hair = light ? 'var(--hair-l)' : 'var(--hair-d)';

  const theta = window.wrap(sim.state.theta);

  return (
    <div className={`${mat}`} style={{ position:'absolute', inset:0, color: ink }}>
      <RunCanvas sim={sim} accent={accent} light={light} perturbing={true} onClickPerturb={(i) => sim.perturb(i)} />

      {/* HUD LEFT */}
      <div style={{ position:'absolute', top: 130, left: 32, width: 230, zIndex: 2 }}>
        <div className="mono-cap-sm" style={{ color: mut, marginBottom: 12 }}>[ 02 ] · HUD</div>
        <div style={{ padding: 12, border: `1px solid ${hair}`, marginBottom: 10 }}>
          <div className="mono-cap-sm" style={{ color: mut }}>θ — ANGLE</div>
          <AngleDial theta={theta} accent={accent} light={light}/>
        </div>
        <div style={{ padding: 12, border: `1px solid ${hair}`, marginBottom: 10, display:'flex', flexDirection:'column', gap: 10 }}>
          <Bar v={sim.state.omega} max={20} label="θ̇ · ANG VEL" sub="rad/s" accent={accent} light={light}/>
          <Bar v={sim.tau} max={PHYS.taumax} label="τ · MOTOR TORQUE" sub="N·m" accent={accent} light={light}/>
        </div>
        <div style={{
          padding: '10px 12px',
          border: `1px solid ${stable ? accent : hair}`,
          background: stable ? 'rgba(212,255,58,.08)' : 'transparent',
          fontFamily:'var(--mono)', fontSize: 11, letterSpacing:'.16em',
          color: stable ? accent : mut,
        }}>
          STATE · {stable ? 'BALANCING' : (sim.region === 'swingup' ? 'SWING-UP' : (Math.abs(theta) > 1.0 ? 'FALLING' : 'RECOVERING'))}
        </div>
      </div>

      {/* HUD RIGHT */}
      <div style={{ position:'absolute', top: 130, right: 32, width: 230, zIndex: 2 }}>
        <div className="mono-cap-sm" style={{ color: mut, marginBottom: 12 }}>PERTURB</div>
        <div style={{ padding: 12, border: `1px solid ${hair}`, marginBottom: 10 }}>
          <div className="mono-cap-sm" style={{ color: mut }}>KEYBOARD</div>
          <div style={{ fontFamily:'var(--mono)', fontSize: 11, color: ink, lineHeight: 1.85, marginTop: 6 }}>
            <div><span className="help-key" style={{ borderColor: keys['w'] ? accent : 'currentColor', color: keys['w'] ? accent : 'inherit' }}>W</span> push up</div>
            <div><span className="help-key" style={{ borderColor: keys['s'] ? accent : 'currentColor', color: keys['s'] ? accent : 'inherit' }}>S</span> push down</div>
            <div><span className="help-key" style={{ borderColor: keys['a'] ? accent : 'currentColor', color: keys['a'] ? accent : 'inherit' }}>A</span> nudge left</div>
            <div><span className="help-key" style={{ borderColor: keys['d'] ? accent : 'currentColor', color: keys['d'] ? accent : 'inherit' }}>D</span> nudge right</div>
          </div>
        </div>
        <div style={{ padding: 12, border: `1px solid ${hair}`, marginBottom: 10 }}>
          <div className="mono-cap-sm" style={{ color: mut, display:'flex', justifyContent:'space-between' }}>
            <span>TORQUE SCALE</span><span>{torqueSet.toFixed(2)}</span>
          </div>
          <input type="range" min="0.1" max="1.6" step="0.05" value={torqueSet} onChange={e => setTorqueSet(parseFloat(e.target.value))} style={{ marginTop: 4 }}/>
          <div style={{ fontFamily:'var(--mono)', fontSize: 9, color: 'var(--fnt-d)', marginTop: 2 }}>multiplies WASD impulse · 0.10 → 1.60</div>
        </div>
        <button className="btn primary" onClick={() => sim.perturb(8 * torqueSet * (Math.random() > 0.5 ? 1 : -1))} style={{ width:'100%' }}>
          [ FIRE PERTURB ]
        </button>
        <button className="btn" onClick={() => sim.reset()} style={{ width:'100%', marginTop: 6, color: ink, borderColor: hair }}>[ RESET ]</button>
        <button className="btn" onClick={() => sim.catch()} style={{ width:'100%', marginTop: 6, color: ink, borderColor: hair }}>[ CATCH @ UPRIGHT ]</button>
      </div>

      {/* Click hint */}
      <div style={{ position:'absolute', top: '50%', left:'50%', transform:'translate(-50%, 100px)', fontFamily:'var(--mono)', fontSize: 10, letterSpacing:'.18em', color: 'var(--fnt-d)', pointerEvents:'none' }}>
        click anywhere → impulse
      </div>
    </div>
  );
}

// ─── STUDIO ──────────────────────────────────────────────────────────────────
function StudioPanel({ children, title, num, total, onClose, onPrev, onNext, light, accent }) {
  const cls = light ? 'panel panel-light' : 'panel';
  const ink = light ? 'var(--ink-on-bone)' : 'var(--ink-on-lab)';
  const mut = light ? 'var(--mut-l)' : 'var(--mut-d)';
  const hair = light ? 'var(--hair-l)' : 'var(--hair-d)';
  return (
    <div className={cls + ' slide-up'} style={{ position:'absolute', top: 210, left:'50%', transform:'translateX(-50%)', width: 880, padding: 28, color: ink }}>
      <div className="brackets" style={{ color: ink }}><i className="br-tr"/><i className="br-br"/></div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: 14 }}>
        <div>
          <div className="mono-cap-sm" style={{ color: mut }}>[ {num} / {total} ] · {title}</div>
          <div style={{ fontFamily:'var(--display)', fontWeight: 900, fontSize: 28, marginTop: 4, letterSpacing:'-.015em' }}>{title}.</div>
        </div>
        <div style={{ display:'flex', gap: 6 }}>
          {onPrev && <button className="btn" onClick={onPrev} style={{ color: ink, borderColor: hair }}>←</button>}
          {onNext && <button className="btn" onClick={onNext} style={{ color: ink, borderColor: hair }}>→</button>}
          <button className="btn" onClick={onClose} style={{ color: ink, borderColor: hair }}>×</button>
        </div>
      </div>
      <div className="hair-d" style={{ background: hair, marginBottom: 16 }}/>
      {children}
    </div>
  );
}

function DiagramPanel({ light, accent, onClose }) {
  const [i, setI] = useState(1);
  const diagrams = [
    { name: 'DESTABILIZER',       blocks: ['r(t)', 'V = Vmax · sgn(θ̇)', 'PLANT'] },
    { name: 'FULL CASCADE',       blocks: ['r(t)', 'POSITION CTRL', 'CURRENT CTRL', 'PLANT'] },
    { name: 'POSITION CONTROLLER',blocks: ['θ_ref', 'Kp + Kd·s', 'i_ref'] },
    { name: 'CURRENT CONTROLLER', blocks: ['i_ref', 'PI', 'MOTOR']      },
  ];
  const d = diagrams[i];
  const ink = light ? 'var(--ink-on-bone)' : 'var(--ink-on-lab)';
  const mut = light ? 'var(--mut-l)' : 'var(--mut-d)';
  const hair = light ? 'var(--hair-l)' : 'var(--hair-d)';
  return (
    <StudioPanel title={`DIAGRAM · ${d.name}`} num={String(i+1).padStart(2,'0')} total="04"
      onPrev={() => setI((i + diagrams.length - 1) % diagrams.length)}
      onNext={() => setI((i + 1) % diagrams.length)}
      onClose={onClose} light={light} accent={accent}>
      <div style={{ display:'flex', alignItems:'center', gap: 0, marginTop: 22, marginBottom: 18 }}>
        {d.blocks.map((b, idx) => (
          <React.Fragment key={idx}>
            <div style={{
              flex: '1 1 0', padding:'16px 8px', textAlign:'center',
              border: `1px solid ${idx === d.blocks.length - 1 ? accent : ink}`,
              fontFamily:'var(--mono)', fontSize: 11, letterSpacing:'.12em',
              color: idx === d.blocks.length - 1 ? accent : ink,
            }}>{b}</div>
            {idx < d.blocks.length - 1 && (
              <div style={{ width: 32, height: 1, background: ink, position:'relative', flexShrink: 0 }}>
                <span style={{ position:'absolute', right: -1, top: -4, color: ink }}>▸</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop: 18 }} className="mono-cap-sm">
        <span style={{ color: mut }}>↳ FEEDBACK · θ · θ̇ · i</span>
        <span style={{ color: accent }}>[ {String(i+1).padStart(2,'0')} / {String(diagrams.length).padStart(2,'0')} ]</span>
      </div>
      <div style={{ marginTop: 18, padding: 14, border: `1px solid ${hair}` }}>
        <div className="mono-cap-sm" style={{ color: mut, marginBottom: 6 }}>SIGNAL DICTIONARY</div>
        <div style={{ fontFamily:'var(--mono)', fontSize: 11, color: ink, lineHeight: 1.7, columnCount: 2, columnGap: 24 }}>
          <div>r(t) &nbsp;·&nbsp; reference angle</div>
          <div>θ &nbsp;·&nbsp; measured angle</div>
          <div>θ̇ &nbsp;·&nbsp; angular velocity</div>
          <div>i &nbsp;·&nbsp; motor current</div>
          <div>τ &nbsp;·&nbsp; motor torque</div>
          <div>V &nbsp;·&nbsp; bus voltage</div>
        </div>
      </div>
    </StudioPanel>
  );
}

function PlotsPanel({ light, accent, onClose, sim }) {
  const ink = light ? 'var(--ink-on-bone)' : 'var(--ink-on-lab)';
  const mut = light ? 'var(--mut-l)' : 'var(--mut-d)';
  const hair = light ? 'var(--hair-l)' : 'var(--hair-d)';

  // Pole-zero map (open loop)
  const PZ = () => (
    <svg viewBox="0 0 360 220" style={{ width:'100%', height:'auto' }}>
      <defs>
        <pattern id="pzg" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke={hair} strokeWidth=".5"/>
        </pattern>
      </defs>
      <rect width="360" height="220" fill="url(#pzg)"/>
      <line x1="0" y1="110" x2="360" y2="110" stroke={mut} strokeWidth=".8"/>
      <line x1="220" y1="0" x2="220" y2="220" stroke={mut} strokeWidth=".8"/>
      {/* poles */}
      <g stroke={ink} strokeWidth="1.4">
        <line x1="40" y1="103" x2="50" y2="117"/><line x1="40" y1="117" x2="50" y2="103"/>
        <line x1="148" y1="103" x2="158" y2="117"/><line x1="148" y1="117" x2="158" y2="103"/>
      </g>
      <g stroke={accent} strokeWidth="1.8">
        <line x1="226" y1="103" x2="236" y2="117"/><line x1="226" y1="117" x2="236" y2="103"/>
      </g>
      <text x="34" y="135" fontFamily="Geist Mono" fontSize="9" fill={mut}>−14.27</text>
      <text x="142" y="135" fontFamily="Geist Mono" fontSize="9" fill={mut}>−2.94</text>
      <text x="224" y="98" fontFamily="Geist Mono" fontSize="9" fill={accent}>+0.01</text>
      <text x="6" y="218" fontFamily="Geist Mono" fontSize="9" fill={mut}>Re(s)</text>
      <text x="224" y="14" fontFamily="Geist Mono" fontSize="9" fill={mut}>Im(s)</text>
    </svg>
  );

  // Step-response curve from history
  const Step = () => {
    const h = sim.history || [];
    if (h.length < 2) {
      return <div style={{ height: 220, display:'flex', alignItems:'center', justifyContent:'center', color: mut, fontFamily:'var(--mono)', fontSize: 11 }}>collecting samples…</div>;
    }
    const minT = h[0].t, maxT = h[h.length-1].t;
    const span = Math.max(0.1, maxT - minT);
    const pts = h.filter((_, i) => i % 8 === 0).map(p => {
      const x = ((p.t - minT) / span) * 360;
      const y = 110 - Math.max(-1, Math.min(1, p.theta)) * 60;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return (
      <svg viewBox="0 0 360 220" style={{ width:'100%', height:'auto' }}>
        <defs>
          <pattern id="stg" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke={hair} strokeWidth=".5"/>
          </pattern>
        </defs>
        <rect width="360" height="220" fill="url(#stg)"/>
        <line x1="0" y1="110" x2="360" y2="110" stroke={mut} strokeWidth=".8"/>
        <line x1="0" y1="50" x2="360" y2="50" stroke={hair} strokeDasharray="3 3"/>
        <line x1="0" y1="170" x2="360" y2="170" stroke={hair} strokeDasharray="3 3"/>
        <polyline points={pts} fill="none" stroke={accent} strokeWidth="1.4"/>
        <text x="6" y="14" fontFamily="Geist Mono" fontSize="9" fill={mut}>θ(t)  · +1</text>
        <text x="6" y="218" fontFamily="Geist Mono" fontSize="9" fill={mut}>t →  6s window</text>
      </svg>
    );
  };

  return (
    <StudioPanel title="PLOTS" num="01" total="01" onClose={onClose} light={light} accent={accent}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 18 }}>
        <div>
          <div className="mono-cap-sm" style={{ color: mut, marginBottom: 6 }}>POLE-ZERO · OPEN LOOP</div>
          <PZ/>
        </div>
        <div>
          <div className="mono-cap-sm" style={{ color: mut, marginBottom: 6 }}>θ(t) · LIVE TRACE</div>
          <Step/>
        </div>
      </div>
      <div style={{ display:'flex', gap: 8, marginTop: 16 }}>
        <div className="tile" style={{ flex:1, borderColor: hair }}><div className="tile-h" style={{ color: mut }}>SETTLE</div><div className="tile-v" style={{ color: ink }}>0.84 s</div></div>
        <div className="tile" style={{ flex:1, borderColor: hair }}><div className="tile-h" style={{ color: mut }}>OVERSHOOT</div><div className="tile-v" style={{ color: ink }}>12 %</div></div>
        <div className="tile" style={{ flex:1, borderColor: hair }}><div className="tile-h" style={{ color: mut }}>ITAE</div><div className="tile-v" style={{ color: ink }}>0.31</div></div>
        <div className="tile accent" style={{ flex:1, borderColor: accent }}><div className="tile-h" style={{ color: mut }}>PHASE MARGIN</div><div className="tile-v" style={{ color: accent }}>42°</div></div>
      </div>
    </StudioPanel>
  );
}

function MathPanel({ light, accent, onClose }) {
  const ink = light ? 'var(--ink-on-bone)' : 'var(--ink-on-lab)';
  const mut = light ? 'var(--mut-l)' : 'var(--mut-d)';
  const hair = light ? 'var(--hair-l)' : 'var(--hair-d)';
  const Eq = ({ label, expr }) => (
    <div>
      <div className="mono-cap-sm" style={{ color: mut }}>{label}</div>
      <div className="serif-i" style={{ fontSize: 32, marginTop: 6, color: ink, lineHeight: 1.1, letterSpacing:'-.005em' }}>{expr}</div>
    </div>
  );
  return (
    <StudioPanel title="MATH" num="01" total="01" onClose={onClose} light={light} accent={accent}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 24 }}>
        <Eq label="↳ PLANT"        expr={<>J θ̈ + b θ̇ &nbsp;=&nbsp; K·i + m g L sin(θ)</>}/>
        <Eq label="↳ DESTABILIZER" expr={<>V &nbsp;=&nbsp; V<sub>max</sub> · sgn(θ̇)</>}/>
        <Eq label="↳ PD CONTROL"   expr={<>θ̈<sub>c</sub> &nbsp;=&nbsp; −K<sub>p</sub>·θ &nbsp;−&nbsp; K<sub>d</sub>·θ̇</>}/>
        <div>
          <div className="mono-cap-sm" style={{ color: mut }}>↳ GAINS / POLES</div>
          <div style={{ fontFamily:'var(--mono)', fontSize: 13, lineHeight: 1.8, marginTop: 8, color: ink }}>
            <div>K<sub>p</sub> = 196 &nbsp; K<sub>d</sub> = 28 &nbsp; K<sub>p,i</sub> = 446</div>
            <div>poles: <span>−14.27 · −2.94 · </span><span style={{ color: accent }}>+0.01</span></div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 22, padding: 14, border: `1px solid ${hair}` }}>
        <div className="mono-cap-sm" style={{ color: mut, marginBottom: 6 }}>NOTES</div>
        <div style={{ fontFamily:'var(--mono)', fontSize: 11, lineHeight: 1.7, color: ink }}>
          The third pole sits a hair into the right-half plane. Open-loop, the rod always falls.
          Closed under PD with these gains, the system is critically damped — settles inside one second.
        </div>
      </div>
    </StudioPanel>
  );
}

function Studio({ sim, entering, accent, light }) {
  const [open, setOpen] = useState('diagram');
  const cycle = ['diagram', 'plots', 'math'];

  // keyboard D / P / M
  useEffect(() => {
    const h = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'd') setOpen('diagram');
      else if (k === 'p') setOpen('plots');
      else if (k === 'm') setOpen('math');
      else if (k === 'escape') setOpen(null);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const mat = light ? 'mat-l' : 'mat-d';
  const ink = light ? 'var(--ink-on-bone)' : 'var(--ink-on-lab)';
  const mut = light ? 'var(--mut-l)' : 'var(--mut-d)';

  return (
    <div className={`${mat}`} style={{ position:'absolute', inset:0, color: ink }}>
      {/* Dimmed live canvas in background */}
      <div style={{ position:'absolute', inset:0, opacity: open ? 0.42 : 1, transition: 'opacity .35s ease' }}>
        <RunCanvas sim={sim} accent={accent} light={light}/>
      </div>
      {/* Overlay panel */}
      {open === 'diagram' && <DiagramPanel light={light} accent={accent} onClose={() => setOpen(null)}/>}
      {open === 'plots'   && <PlotsPanel   light={light} accent={accent} onClose={() => setOpen(null)} sim={sim}/>}
      {open === 'math'    && <MathPanel    light={light} accent={accent} onClose={() => setOpen(null)}/>}

      {/* Sub-pill row */}
      <div style={{ position:'absolute', top: 130, left:'50%', transform:'translateX(-50%)', display:'flex', gap: 8, zIndex: 4 }}>
        {[['diagram','D','DIAGRAM'], ['plots','P','PLOTS'], ['math','M','MATH']].map(([id, n, l]) => (
          <button key={id} className={'pill ' + (open === id ? 'active' : '')} data-light={light ? 'true' : 'false'} onClick={() => setOpen(open === id ? null : id)}>
            <span className="pn">{n}</span>
            <span>[ {l} ]</span>
          </button>
        ))}
      </div>

      {/* Closed-state prompt */}
      {!open && (
        <div style={{ position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
          <div className="mono-cap-sm" style={{ color: mut }}>STUDIO · OVERLAY DISMISSED</div>
          <div style={{ fontFamily:'var(--display)', fontWeight: 900, fontSize: 56, letterSpacing:'-.02em' }}>watch <span className="serif-i" style={{ color: accent }}>the rig.</span></div>
          <div className="mono-cap-sm" style={{ color: mut, marginTop: 10 }}>[D]·DIAGRAM &nbsp; [P]·PLOTS &nbsp; [M]·MATH</div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Loader, Kit, Run, Studio, useAnimationFrame });
