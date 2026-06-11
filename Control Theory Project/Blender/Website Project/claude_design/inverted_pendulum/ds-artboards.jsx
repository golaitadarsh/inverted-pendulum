// Design system artboards — palette, type, chrome motif, components, motion, a11y.
// All artboards stand alone but share T tokens + Frame from ds-primitives.

const { Brackets, Crosshair, CuttingMat, Frame, SectionHead, Tile, KV, Region, ModePill } = window;
const T = window.T;

// ─── INTRO ─────────────────────────────────────────────────────────────────────
function IntroBoard() {
  return (
    <Frame dark padding={32}>
      <SectionHead num="00" label="Brief" title="INVERTED PENDULUM /" sub="College control-theory demo · Three.js + live ODE · Standalone sub-page off main portfolio" />
      <div style={{ marginTop: 18, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 22 }}>
        <div>
          <div style={{ fontFamily: T.serif, fontStyle:'italic', fontSize: 56, color: T.accent, lineHeight: .92, letterSpacing:'-.02em' }}>three modes,</div>
          <div style={{ fontFamily: T.display, fontWeight: 900, fontSize: 56, color: T.txtD, lineHeight: .92, letterSpacing:'-.02em' }}>one demo.</div>
          <div style={{ marginTop: 18, fontFamily: T.mono, fontSize: 11, color: T.mutD, letterSpacing:'.04em', maxWidth: 340, lineHeight: 1.6 }}>
            A continuation of the portfolio: same display grotesk, same italic serif accent, same acid-green pop. Lab-demo chrome borrowed from engineering drawings, not from anyone else's site.
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <KV dark k="MODE 01" v="[ KIT ]"     accent />
          <KV dark k="MODE 02" v="[ RUN ]" />
          <KV dark k="MODE 03" v="[ STUDIO ]" />
          <div style={{ height:1, background: T.hairD, margin:'8px 0' }}/>
          <KV dark k="HW" v="ARDUINO UNO · RS-775 · ENCODER" />
          <KV dark k="CTRL" v="PD · Kp 196 · Kd 28" />
          <KV dark k="POLES" v="−14.27 · −2.94 · +0.01" />
          <KV dark k="STACK" v="THREE.JS · ODE / RK4 · 60FPS" />
        </div>
      </div>
      <div style={{ position:'absolute', bottom: 18, left: 32, right: 32, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div style={{ fontFamily: T.mono, fontSize: 9, color: T.fntD, letterSpacing:'.18em' }}>↳ PASS 1 / SYSTEM + WIREFRAMES — PROTOTYPE TO FOLLOW</div>
        <div style={{ fontFamily: T.mono, fontSize: 9, color: T.fntD, letterSpacing:'.18em' }}>v0.1 · 2026</div>
      </div>
    </Frame>
  );
}

// ─── PALETTE ───────────────────────────────────────────────────────────────────
function Swatch({ name, hex, ink, bg, role, big, dark }) {
  return (
    <div style={{ background: bg, color: ink, padding: 14, height: big ? 140 : 100, position:'relative', border:`1px solid ${dark ? T.hairD : T.hairL}` }}>
      <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', textTransform:'uppercase', opacity:.6 }}>{role}</div>
      <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: big ? 22 : 16, marginTop: 4, letterSpacing:'-.01em' }}>{name}</div>
      <div style={{ position:'absolute', bottom: 10, left: 14, fontFamily: T.mono, fontSize: 10, opacity:.7 }}>{hex}</div>
    </div>
  );
}
function PaletteBoard() {
  return (
    <Frame padding={26}>
      <SectionHead num="01" label="Palette" title="Monochrome + one acid" sub="Two surfaces (Lab dark / Bone light) · one accent · no greys-as-color" />
      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap: 14, marginTop: 14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10 }}>
          <Swatch role="SURFACE / DARK"  name="Lab"   hex="#0E0E0C" bg={T.inkD}  ink={T.txtD} big/>
          <Swatch role="SURFACE / LIGHT" name="Bone"  hex="#F5F3EE" bg={T.inkL}  ink={T.txtL} big/>
          <Swatch role="ACCENT"          name="Acid"  hex="#D4FF3A" bg={T.accent} ink={T.inkD} big/>
          <Swatch role="SIGNAL / WARN"   name="Flag"  hex="#FF6A3D" bg={T.warn}   ink={T.inkD} big/>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap: 8, fontFamily: T.mono, fontSize: 10, color: T.mutL }}>
          <div style={{ color: T.txtL, fontWeight:600, letterSpacing:'.14em' }}>USAGE</div>
          <KV k="ACCENT" v="≤8% AREA" />
          <KV k="WARN" v="UNSTABLE STATE ONLY" />
          <KV k="HAIRLINES" v="14% INK" />
          <KV k="MUTED TEXT" v="55% INK" />
          <KV k="FAINT TEXT" v="32% INK" />
          <div style={{ height:1, background: T.hairL, margin:'6px 0' }}/>
          <div style={{ color: T.txtL, fontWeight:600, letterSpacing:'.14em' }}>RULES</div>
          <div style={{ lineHeight:1.6 }}>· no gradients<br/>· no greys-as-decoration<br/>· no second accent<br/>· dark default; light for [STUDIO] dossier</div>
        </div>
      </div>
    </Frame>
  );
}

// ─── TYPE ──────────────────────────────────────────────────────────────────────
function TypeBoard() {
  return (
    <Frame padding={26}>
      <SectionHead num="02" label="Type" title="Two-voice display + mono UI" sub="GEIST 900 · INSTRUMENT SERIF italic · GEIST MONO" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap: 12, marginTop: 12 }}>
        <div style={{ borderTop:`1px solid ${T.hairL}`, paddingTop: 10 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', color: T.mutL }}>DISPLAY · GEIST · 900 · −0.02em</div>
          <div style={{ fontFamily: T.display, fontWeight: 900, fontSize: 56, lineHeight:.95, letterSpacing:'-.02em' }}>STABILIZE.</div>
        </div>
        <div style={{ borderTop:`1px solid ${T.hairL}`, paddingTop: 10 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', color: T.mutL }}>ACCENT · INSTRUMENT SERIF · ITALIC</div>
          <div style={{ fontFamily: T.serif, fontStyle:'italic', fontSize: 48, lineHeight:.95, letterSpacing:'-.01em', color: T.accentDim }}>balance is a state.</div>
        </div>
        <div style={{ borderTop:`1px solid ${T.hairL}`, paddingTop: 10, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14 }}>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', color: T.mutL }}>UI · GEIST MONO · 11 / 0.10em</div>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing:'.1em', textTransform:'uppercase' }}>[ KIT ] · θ = 0.142 rad · 60fps</div>
          </div>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', color: T.mutL }}>UI · GEIST MONO · 10 / 0.18em</div>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing:'.18em', textTransform:'uppercase' }}>01 · KIT — EXPLODED HARDWARE</div>
          </div>
        </div>
        <div style={{ borderTop:`1px solid ${T.hairL}`, paddingTop: 10 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', color: T.mutL }}>SCALE</div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.txtL, marginTop:4, lineHeight:1.7 }}>
            DISPLAY 96 / 72 / 56 / 40 &nbsp; — &nbsp; LABEL 11 / 10 / 9 &nbsp; — &nbsp; BODY (mono) 13 / 12 / 11
          </div>
        </div>
      </div>
    </Frame>
  );
}

// ─── CHROME ────────────────────────────────────────────────────────────────────
function ChromeBoard() {
  return (
    <Frame padding={26}>
      <SectionHead num="03" label="Chrome motif" title="Brackets + crosshairs" sub="Panels get [ corners ] · canvas gets + ticks · titles get [ NUM ]" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop: 14 }}>
        <div style={{ position:'relative', height: 200, background: T.inkD, color: T.txtD }}>
          <Brackets color={T.txtD} inset={10} size={14}/>
          <div style={{ position:'absolute', top: 12, left: 14, fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', color: T.mutD }}>PANEL · DARK · BRACKETS</div>
          <div style={{ position:'absolute', bottom: 14, left: 14, fontFamily: T.display, fontWeight: 700, fontSize: 22 }}>[ DIAGRAM ]</div>
        </div>
        <div style={{ position:'relative', height: 200, background: T.inkL, color: T.txtL, border:`1px solid ${T.hairL}` }}>
          <Brackets color={T.txtL} inset={10} size={14}/>
          <div style={{ position:'absolute', top: 12, left: 14, fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', color: T.mutL }}>PANEL · LIGHT · BRACKETS</div>
          <div style={{ position:'absolute', bottom: 14, left: 14, fontFamily: T.display, fontWeight: 700, fontSize: 22 }}>[ MATH ]</div>
        </div>
        <div style={{ position:'relative', height: 200, background: T.inkD, color: T.txtD }}>
          <CuttingMat dark/>
          <Crosshair color={T.mutD} size={10} style={{ position:'absolute', top:10, left:10 }}/>
          <Crosshair color={T.mutD} size={10} style={{ position:'absolute', top:10, right:10 }}/>
          <Crosshair color={T.mutD} size={10} style={{ position:'absolute', bottom:10, left:10 }}/>
          <Crosshair color={T.mutD} size={10} style={{ position:'absolute', bottom:10, right:10 }}/>
          <div style={{ position:'absolute', top: 12, left: 28, fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', color: T.mutD }}>CANVAS · CUTTING-MAT · CROSSHAIRS</div>
        </div>
        <div style={{ position:'relative', height: 200, background: T.inkL, color: T.txtL, border:`1px solid ${T.hairL}` }}>
          <div style={{ position:'absolute', top:12, left:14, fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', color: T.mutL }}>HEADER / NUMBERING CONVENTION</div>
          <div style={{ position:'absolute', top: 50, left: 14, right: 14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, fontFamily: T.mono, fontSize: 11, letterSpacing:'.18em', color: T.mutL }}>
              <span>[ 01 ]</span>
              <span style={{ display:'inline-block', width:14, height:1, background: T.mutL }}/>
              <span>KIT</span>
            </div>
            <div style={{ fontFamily: T.display, fontWeight: 900, fontSize: 36, marginTop: 6, letterSpacing:'-.02em' }}>EXPLODED.</div>
            <div style={{ fontFamily: T.serif, fontStyle:'italic', fontSize: 28, marginTop:-4, color: T.accentDim }}>every part labeled.</div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

// ─── PILLS ─────────────────────────────────────────────────────────────────────
function PillBoard() {
  return (
    <Frame padding={26}>
      <SectionHead num="04" label="Mode pills" title="The bottom-center picker" sub="DEFAULT · HOVER · ACTIVE · DISABLED — on dark + light" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap: 14, marginTop: 14 }}>
        <div style={{ background: T.inkD, padding:'22px 18px', position:'relative' }}>
          <div style={{ position:'absolute', top:8, left:14, fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', color: T.mutD }}>DARK</div>
          <div style={{ display:'flex', gap:10, marginTop: 14, justifyContent:'center' }}>
            <ModePill dark num="01" label="KIT" />
            <ModePill dark num="02" label="RUN" hover />
            <ModePill dark num="03" label="STUDIO" active />
          </div>
          <div style={{ display:'flex', gap: 18, marginTop: 14, justifyContent:'center', fontFamily: T.mono, fontSize: 9, letterSpacing:'.14em', color: T.fntD }}>
            <span>DEFAULT</span><span>HOVER</span><span>ACTIVE</span>
          </div>
        </div>
        <div style={{ background: T.inkL, padding:'22px 18px', position:'relative', border:`1px solid ${T.hairL}` }}>
          <div style={{ position:'absolute', top:8, left:14, fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', color: T.mutL }}>LIGHT</div>
          <div style={{ display:'flex', gap:10, marginTop: 14, justifyContent:'center' }}>
            <ModePill num="01" label="KIT" active />
            <ModePill num="02" label="RUN" />
            <ModePill num="03" label="STUDIO" hover />
          </div>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.mutL, lineHeight: 1.6 }}>
          <div style={{ color: T.txtL, letterSpacing:'.14em' }}>SPEC</div>
          <div>· 1px hairline border · 14px horizontal padding · 11px mono caps with 0.16em tracking</div>
          <div>· active inverts surface/ink · hover lifts bg to 4% ink · transition 180ms ease</div>
          <div>· keyboard: ←/→ cycles · 1/2/3 jumps · focus ring = 2px accent offset 2px</div>
        </div>
      </div>
    </Frame>
  );
}

// ─── PANELS & TILES ────────────────────────────────────────────────────────────
function PanelBoard() {
  return (
    <Frame padding={26}>
      <SectionHead num="05" label="Panels & tiles" title="Studio surfaces" sub="Bracket panels open/close · datasheet tiles inside" />
      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap: 12, marginTop: 12 }}>
        <div style={{ position:'relative', background: T.inkD, color: T.txtD, padding: 18, height: 280 }}>
          <Brackets color={T.txtD} inset={10} size={14}/>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 10 }}>
            <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', color: T.mutD }}>[ DIAGRAM ] · OPEN</div>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.mutD }}>×</div>
          </div>
          <div style={{ fontFamily: T.display, fontWeight: 900, fontSize: 22, letterSpacing:'-.01em' }}>FULL CASCADE.</div>
          <div style={{ marginTop: 10, display:'flex', gap: 8 }}>
            <Tile dark header="Kp" value="196" sub="POSITION" />
            <Tile dark header="Kd" value="28"  sub="VELOCITY" />
            <Tile dark header="Kp,i" value="446" sub="CURRENT" accent />
          </div>
          <div style={{ marginTop: 12, display:'flex', flexDirection:'column', gap:6 }}>
            <KV dark k="POLE 1" v="−14.27" />
            <KV dark k="POLE 2" v="−2.94" />
            <KV dark k="POLE 3" v="+0.01" accent />
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
          <div style={{ position:'relative', background: T.inkL, color: T.txtL, padding: 14, height: 100, border:`1px solid ${T.hairL}` }}>
            <Brackets color={T.txtL} inset={8} size={10}/>
            <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', color: T.mutL }}>BUTTON · GHOST</div>
            <div style={{ marginTop: 22, display:'flex', gap: 8 }}>
              <div style={{ padding:'6px 12px', border:`1px solid ${T.hairL}`, fontFamily: T.mono, fontSize: 10, letterSpacing:'.16em' }}>[ RESET ]</div>
              <div style={{ padding:'6px 12px', border:`1px solid ${T.txtL}`, background: T.txtL, color: T.inkL, fontFamily: T.mono, fontSize: 10, letterSpacing:'.16em' }}>[ PERTURB ]</div>
              <div style={{ padding:'6px 12px', border:`1px solid ${T.hairL}`, color: T.fntL, fontFamily: T.mono, fontSize: 10, letterSpacing:'.16em' }}>[ DISABLED ]</div>
            </div>
          </div>
          <div style={{ position:'relative', background: T.inkL, color: T.txtL, padding: 14, height: 168, border:`1px solid ${T.hairL}` }}>
            <Brackets color={T.txtL} inset={8} size={10}/>
            <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', color: T.mutL }}>TILE GROUP · 2×2</div>
            <div style={{ marginTop: 10, display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              <Tile header="θ"      value="0.142 rad" />
              <Tile header="θ̇"      value="0.31 rad/s" />
              <Tile header="i"      value="1.74 A" />
              <Tile header="STATE"  value="BALANCING" accent />
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

// ─── LOADER ───────────────────────────────────────────────────────────────────
function LoaderBoard() {
  return (
    <Frame dark padding={26} withMat>
      <SectionHead num="06" label="Loader" title="Boot sequence" dark sub="Progress bar + asset manifest ticking + pole-zero drawing itself in" />
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 16, marginTop: 16 }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', color: T.mutD }}>LOADING — ASSETS</div>
          <div style={{ marginTop: 12, height: 4, background: T.hairD, position:'relative' }}>
            <div style={{ position:'absolute', left:0, top:0, height:'100%', width:'62%', background: T.accent }}/>
          </div>
          <div style={{ marginTop: 8, display:'flex', justifyContent:'space-between', fontFamily: T.mono, fontSize: 10, color: T.mutD }}>
            <span>0.62 / 1.00</span><span>062%</span>
          </div>
          <div style={{ marginTop: 18, fontFamily: T.mono, fontSize: 10, color: T.mutD, lineHeight: 1.65 }}>
            <div>✓ &nbsp; KIT.GLB &nbsp;&nbsp; 1.2MB</div>
            <div>✓ &nbsp; ROD.GLB &nbsp;&nbsp; 184KB</div>
            <div>✓ &nbsp; ENCODER.GLB &nbsp;&nbsp; 92KB</div>
            <div style={{ color: T.accent }}>↳ &nbsp; MAT.PNG &nbsp;&nbsp; 38%</div>
            <div style={{ color: T.fntD }}>· &nbsp; PLOTS.JSON</div>
            <div style={{ color: T.fntD }}>· &nbsp; SHADER.GLSL</div>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', color: T.mutD }}>POLE-ZERO · DRAWING</div>
          <svg viewBox="0 0 200 160" style={{ width:'100%', height: 'auto', marginTop: 8 }}>
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke={T.hairD} strokeWidth=".5"/>
              </pattern>
            </defs>
            <rect width="200" height="160" fill="url(#grid)"/>
            {/* axes */}
            <line x1="0" y1="80" x2="200" y2="80" stroke={T.mutD} strokeWidth=".75"/>
            <line x1="120" y1="0" x2="120" y2="160" stroke={T.mutD} strokeWidth=".75"/>
            {/* poles ×  — two stable (left), one unstable (right) */}
            <g stroke={T.txtD} strokeWidth="1.4">
              <line x1="20" y1="74" x2="28" y2="82"/><line x1="20" y1="82" x2="28" y2="74"/>
              <line x1="78" y1="74" x2="86" y2="82"/><line x1="78" y1="82" x2="86" y2="74"/>
            </g>
            <g stroke={T.accent} strokeWidth="1.6">
              <line x1="124" y1="74" x2="132" y2="82"/><line x1="124" y1="82" x2="132" y2="74"/>
            </g>
            <text x="6" y="156" fontFamily="Geist Mono" fontSize="7" fill={T.fntD}>RE(s)</text>
            <text x="124" y="10" fontFamily="Geist Mono" fontSize="7" fill={T.fntD}>IM(s)</text>
            <text x="20" y="68" fontFamily="Geist Mono" fontSize="6" fill={T.mutD}>−14.27</text>
            <text x="74" y="68" fontFamily="Geist Mono" fontSize="6" fill={T.mutD}>−2.94</text>
            <text x="118" y="68" fontFamily="Geist Mono" fontSize="6" fill={T.accent}>+0.01</text>
          </svg>
          <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing:'.14em', color: T.fntD, marginTop: 6 }}>↳ THIRD POLE UNSTABLE — DEMO POINT</div>
        </div>
      </div>
    </Frame>
  );
}

// ─── MOTION ────────────────────────────────────────────────────────────────────
function MotionBoard() {
  return (
    <Frame padding={26}>
      <SectionHead num="07" label="Motion" title="Tokens & curves" sub="One easing language across mode switch · panel open · loader · perturb response" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16, marginTop: 14 }}>
        <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
          <KV k="MODE SWITCH" v="320ms" />
          <KV k="PANEL OPEN"  v="220ms" />
          <KV k="HOVER"       v="140ms" />
          <KV k="LOADER BAR"  v="LINEAR" />
          <KV k="ASSET TICK"  v="60ms STAGGER" />
          <div style={{ height:1, background: T.hairL, margin:'6px 0' }}/>
          <KV k="EASE OUT"  v="CUBIC(.2,.7,.3,1)" />
          <KV k="EASE IN"   v="CUBIC(.6,0,.7,.2)" />
          <KV k="OVERSHOOT" v="CUBIC(.5,1.6,.4,1)" />
          <KV k="STEP"      v="STEPS(8,END)" accent />
        </div>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', color: T.mutL }}>EASE OUT — PRIMARY</div>
          <svg viewBox="0 0 200 100" style={{ width:'100%', height:'auto', marginTop: 8 }}>
            <rect width="200" height="100" fill="none" stroke={T.hairL}/>
            <line x1="0" y1="100" x2="200" y2="0" stroke={T.hairL} strokeDasharray="2 3"/>
            <path d="M 0 100 C 40 30, 60 0, 200 0" fill="none" stroke={T.txtL} strokeWidth="1.5"/>
            <text x="6" y="14" fontFamily="Geist Mono" fontSize="7" fill={T.mutL}>1.0</text>
            <text x="180" y="96" fontFamily="Geist Mono" fontSize="7" fill={T.mutL}>1.0</text>
          </svg>
          <div style={{ marginTop: 14, fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', color: T.mutL }}>STEP — LOADER TICK</div>
          <svg viewBox="0 0 200 60" style={{ width:'100%', height:'auto', marginTop: 6 }}>
            <rect width="200" height="60" fill="none" stroke={T.hairL}/>
            {[0,1,2,3,4,5,6,7].map(i => (
              <rect key={i} x={i*25} y={50 - i*6} width="22" height={10 + i*6} fill={T.txtL}/>
            ))}
          </svg>
        </div>
      </div>
    </Frame>
  );
}

// ─── A11Y ──────────────────────────────────────────────────────────────────────
function A11yBoard() {
  return (
    <Frame padding={26}>
      <SectionHead num="08" label="Accessibility" title="Notes & guard-rails" sub="Mono UI + tiny serif accent are the trap — these compensate" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14, marginTop: 14, fontFamily: T.mono, fontSize: 11, lineHeight: 1.65 }}>
        <div>
          <div style={{ color: T.txtL, fontWeight:600, letterSpacing:'.14em', marginBottom:6 }}>CONTRAST</div>
          <div>· Ink-on-Bone &nbsp;<span style={{ color: T.accent }}>17.4:1</span></div>
          <div>· Ink-on-Lab &nbsp;&nbsp;<span style={{ color: T.accent }}>15.8:1</span></div>
          <div>· Acid-on-Lab &nbsp;<span style={{ color: T.accent }}>13.1:1</span></div>
          <div>· Acid-on-Bone <span style={{ color: T.warn }}>2.1:1 ✕ TEXT</span></div>
          <div style={{ color: T.mutL, marginTop: 6 }}>↳ Acid is for marks &amp; accents only on light bg, never body text.</div>
        </div>
        <div>
          <div style={{ color: T.txtL, fontWeight:600, letterSpacing:'.14em', marginBottom:6 }}>KEYBOARD</div>
          <div>· 1 / 2 / 3 &nbsp;&nbsp; — jump to mode</div>
          <div>· ← / → &nbsp;&nbsp;&nbsp;&nbsp; — cycle modes</div>
          <div>· D / P / M &nbsp; — Studio panels</div>
          <div>· WASD / drag — perturb rod</div>
          <div>· R &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; — reset · ? &nbsp; — help</div>
        </div>
        <div>
          <div style={{ color: T.txtL, fontWeight:600, letterSpacing:'.14em', marginBottom:6 }}>MOTION</div>
          <div>· `prefers-reduced-motion`: no swing-up anim, no loader pole-zero draw, mode switch = 0ms.</div>
          <div>· No autoplay audio. No flashing &gt;3hz.</div>
        </div>
        <div>
          <div style={{ color: T.txtL, fontWeight:600, letterSpacing:'.14em', marginBottom:6 }}>SCREEN READER</div>
          <div>· Mode pills role=tablist · panels role=tabpanel.</div>
          <div>· Live region for state changes (BALANCING / FELL / RESET).</div>
          <div>· Equations have aria-label with prose form.</div>
        </div>
      </div>
    </Frame>
  );
}

Object.assign(window, {
  IntroBoard, PaletteBoard, TypeBoard, ChromeBoard, PillBoard, PanelBoard, LoaderBoard, MotionBoard, A11yBoard
});
