// Main app — mode router, sim instance, top chrome, mode picker, tweaks.
const { useState, useEffect, useRef } = React;
const { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle, TweakSelect } = window;

const ACCENT_OPTIONS = ['#D4FF3A', '#FF6A3D', '#7AB7FF', '#F4F1E8'];

function TopChrome({ mode, accent, light, modeNumber, modeLabel, sim, fps }) {
  const ink = light ? 'var(--ink-on-bone)' : 'var(--ink-on-lab)';
  const mut = light ? 'var(--mut-l)' : 'var(--mut-d)';
  const theta = sim ? window.wrap(sim.state.theta) : 0;
  const omega = sim ? sim.state.omega : 0;
  return (
    <>
      {/* TL — LAB block */}
      <div style={{ position:'absolute', top: 28, left: 32, zIndex: 5, color: ink }}>
        <div className="mono-cap-sm" style={{ color: mut, display:'flex', alignItems:'center', gap: 8, whiteSpace:'nowrap' }}>
          <span>[ LAB / 04 ]</span>
          <span style={{ display:'inline-block', width:14, height:1, background: mut }}/>
          <span>2026 · v0.1</span>
        </div>
        <div style={{ display:'flex', alignItems:'baseline', gap: 6, marginTop: 2 }}>
          <span style={{ fontFamily:'var(--display)', fontWeight: 900, fontSize: 22, letterSpacing:'-.015em' }}>PENDULUM.</span>
          <span className="serif-i" style={{ fontSize: 18, color: accent, lineHeight: 1, marginLeft: 4 }}>inverted.</span>
        </div>
      </div>

      {/* TR — live readout */}
      <div style={{ position:'absolute', top: 28, right: 32, zIndex: 5, color: ink, textAlign:'right', width: 200 }}>
        <div className="mono-cap-sm" style={{ color: mut }}>READOUT · LIVE</div>
        <div style={{ fontFamily:'var(--mono)', fontSize: 11, lineHeight: 1.55, marginTop: 4, whiteSpace: 'nowrap' }}>
          <div>θ &nbsp;=&nbsp; {theta.toFixed(3)} rad</div>
          <div>θ̇ &nbsp;=&nbsp; {omega.toFixed(2)} rad/s</div>
          <div style={{ color: mut }}>{fps} fps · ode/rk4</div>
        </div>
      </div>
    </>
  );
}

function ModePicker({ mode, setMode, light }) {
  const items = [['kit', '01', 'KIT'], ['run', '02', 'RUN'], ['studio', '03', 'STUDIO']];
  return (
    <div style={{ position:'absolute', bottom: 28, left:'50%', transform:'translateX(-50%)', display:'flex', gap: 10, zIndex: 6 }}>
      {items.map(([id, n, l]) => (
        <button key={id}
          className={'pill ' + (mode === id ? 'active' : '')}
          data-light={light ? 'true' : 'false'}
          onClick={() => setMode(id)}
          aria-pressed={mode === id}
        >
          <span className="pn">{n}</span>
          <span>[ {l} ]</span>
        </button>
      ))}
    </div>
  );
}

function ModeBadge({ mode, light }) {
  const mut = light ? 'var(--mut-l)' : 'var(--mut-d)';
  const ink = light ? 'var(--ink-on-bone)' : 'var(--ink-on-lab)';
  const labels = { kit: ['01', 'KIT.'], run: ['02', 'RUN.'], studio: ['03', 'STUDIO.'] };
  const [n, l] = labels[mode] || ['', ''];
  return (
    <div style={{ position:'absolute', bottom: 32, left: 32, zIndex: 5, display:'flex', alignItems:'center', gap: 10 }}>
      <span className="mono-cap" style={{ color: mut }}>[ {n} ]</span>
      <span style={{ display:'inline-block', width:14, height:1, background: mut }}/>
      <span style={{ fontFamily:'var(--display)', fontWeight: 900, fontSize: 18, color: ink, letterSpacing:'-.01em' }}>{l}</span>
    </div>
  );
}

function HelpBadge({ light, mode }) {
  const mut = light ? 'var(--mut-l)' : 'var(--mut-d)';
  const hints = {
    kit:    '[ 1 KIT ]  [ 2 RUN ]  [ 3 STUDIO ]  [ ? HELP ]',
    run:    '[ WASD ]  [ CLICK ]  [ R RESET ]  [ ? ]',
    studio: '[ D DIAGRAM ]  [ P PLOTS ]  [ M MATH ]  [ ESC ]',
  };
  return (
    <div style={{ position:'absolute', bottom: 32, right: 32, zIndex: 5, fontFamily:'var(--mono)', fontSize: 10, letterSpacing:'.16em', color: mut }}>
      {hints[mode]}
    </div>
  );
}

// ─── Tweaks ────────────────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#D4FF3A",
  "studioLight": false,
  "kitLight": false,
  "showHelp": false
}/*EDITMODE-END*/;

function TweaksUI({ t, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Accent">
        <TweakColor t={t} setTweak={setTweak} k="accent" options={ACCENT_OPTIONS} label="Accent color"/>
      </TweakSection>
      <TweakSection title="Theme">
        <TweakToggle t={t} setTweak={setTweak} k="studioLight" label="Studio: light surface"/>
        <TweakToggle t={t} setTweak={setTweak} k="kitLight"    label="Kit: light surface"/>
      </TweakSection>
      <TweakSection title="Help">
        <TweakToggle t={t} setTweak={setTweak} k="showHelp" label="Show key hints overlay"/>
      </TweakSection>
    </TweaksPanel>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [phase, setPhase] = useState('loader'); // loader | kit | run | studio
  const [entering, setEntering] = useState(true);
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const simRef = useRef(null);
  if (!simRef.current) simRef.current = window.makeSim({ theta: Math.PI - 0.01, omega: 0 });
  const [fps, setFps] = useState(60);

  // physics tick (always running)
  useEffect(() => {
    let raf, last = performance.now();
    let fpsAcc = 0, fpsN = 0;
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      simRef.current.advance(dt);
      if (dt > 0) { fpsAcc += 1/dt; fpsN++; }
      if (fpsN > 30) { setFps(Math.min(999, Math.round(fpsAcc/fpsN))); fpsAcc = 0; fpsN = 0; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // mode keyboard 1/2/3 + space-to-skip loader
  useEffect(() => {
    const h = (e) => {
      if (phase === 'loader' && e.key === ' ') { setPhase('kit'); return; }
      if (e.target.tagName === 'INPUT') return;
      if (e.key === '1') setMode('kit');
      else if (e.key === '2') setMode('run');
      else if (e.key === '3') setMode('studio');
      else if (e.key === 'ArrowRight') {
        const order = ['kit','run','studio'];
        const i = order.indexOf(phase);
        if (i >= 0) setMode(order[(i+1) % 3]);
      } else if (e.key === 'ArrowLeft') {
        const order = ['kit','run','studio'];
        const i = order.indexOf(phase);
        if (i >= 0) setMode(order[(i+order.length-1) % 3]);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [phase]);

  function setMode(m) {
    if (m === phase) return;
    setEntering(false);
    requestAnimationFrame(() => {
      setPhase(m);
      requestAnimationFrame(() => setEntering(true));
    });
    // also nudge sim when entering Run: catch upright so user has fun
    if (m === 'run' && Math.abs(window.wrap(simRef.current.state.theta)) > 1.0) {
      simRef.current.catch();
    }
  }

  // Mode-specific theme: Kit and Studio can independently go light
  const light = (phase === 'studio' && t.studioLight) || (phase === 'kit' && t.kitLight);

  return (
    <div style={{ position:'absolute', inset:0, background: light ? 'var(--bone)' : 'var(--lab)', color: light ? 'var(--ink-on-bone)' : 'var(--ink-on-lab)', transition:'background .4s ease, color .4s ease' }}>
      {/* Outer brackets — always-present chrome */}
      {phase !== 'loader' && (
        <div className="brackets" style={{ color: light ? 'var(--ink-on-bone)' : 'var(--ink-on-lab)' }}>
          <i className="br-tr"/><i className="br-br"/>
        </div>
      )}

      {/* Phase content */}
      {phase === 'loader' && <Loader accent={t.accent} onDone={() => setPhase('kit')}/>}
      {phase === 'kit'    && <Kit    sim={simRef.current} accent={t.accent} light={light} entering={entering}/>}
      {phase === 'run'    && <Run    sim={simRef.current} accent={t.accent} light={light} entering={entering}/>}
      {phase === 'studio' && <Studio sim={simRef.current} accent={t.accent} light={light} entering={entering}/>}

      {/* Persistent chrome (post-loader) */}
      {phase !== 'loader' && <>
        <TopChrome mode={phase} accent={t.accent} light={light} sim={simRef.current} fps={fps}/>
        <ModeBadge mode={phase} light={light}/>
        <ModePicker mode={phase} setMode={setMode} light={light}/>
        <HelpBadge light={light} mode={phase}/>
      </>}

      {/* Help overlay */}
      {t.showHelp && phase !== 'loader' && (
        <div onClick={() => setTweak('showHelp', false)} style={{
          position:'fixed', inset: 0, background: 'rgba(14,14,12,.86)', zIndex: 30,
          backdropFilter: 'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', cursor: 'pointer',
        }}>
          <div style={{ width: 520, padding: 28, border: '1px solid var(--hair-d)', color:'var(--ink-on-lab)' }}>
            <div className="mono-cap-sm" style={{ color:'var(--mut-d)' }}>[ HELP ] · KEY MAP</div>
            <div style={{ fontFamily:'var(--display)', fontWeight: 900, fontSize: 28, marginTop: 4 }}>controls<span className="serif-i" style={{ color: t.accent }}>.</span></div>
            <div className="hair-d" style={{ margin:'14px 0' }}/>
            <div style={{ fontFamily:'var(--mono)', fontSize: 12, lineHeight: 2 }}>
              <div><span className="help-key">1</span> <span className="help-key">2</span> <span className="help-key">3</span> &nbsp; jump to mode</div>
              <div><span className="help-key">←</span> <span className="help-key">→</span> &nbsp; cycle modes</div>
              <div><span className="help-key">D</span> <span className="help-key">P</span> <span className="help-key">M</span> &nbsp; studio sub-panels</div>
              <div><span className="help-key">W</span> <span className="help-key">A</span> <span className="help-key">S</span> <span className="help-key">D</span> &nbsp; perturb rod (Run)</div>
              <div><span className="help-key">click</span> &nbsp; impulse at clicked x</div>
              <div><span className="help-key">R</span> &nbsp; reset · <span className="help-key">C</span> &nbsp; catch upright</div>
              <div><span className="help-key">?</span> &nbsp; this help · <span className="help-key">esc</span> &nbsp; close</div>
            </div>
            <div className="mono-cap-sm" style={{ marginTop: 18, color:'var(--fnt-d)' }}>↳ CLICK ANYWHERE TO DISMISS</div>
          </div>
        </div>
      )}

      <TweaksUI t={t} setTweak={setTweak}/>
    </div>
  );
}

// '?' key opens help
window.addEventListener('keydown', (e) => {
  if (e.key === '?' || (e.shiftKey && e.key === '/')) {
    // toggle via React state — we don't have direct access, so fire a custom event
    window.dispatchEvent(new CustomEvent('__toggle_help'));
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
