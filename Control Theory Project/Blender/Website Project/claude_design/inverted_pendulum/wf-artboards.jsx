// Wireframes — Kit / Run / Studio (Diagram, Plots, Math) + Loader + Mobile.
// Low-fi: dashed regions, mono labels, region codes. No design polish.

const { Brackets, Crosshair, CuttingMat, Frame, SectionHead, Tile, KV, Region, ModePill } = window;
const T = window.T;

// Shared chrome — top-left LAB title block + mode pill row at bottom
function PageChrome({ activeMode, dark = false, modeNumber, modeLabel }) {
  const ink = dark ? T.txtD : T.txtL;
  const mut = dark ? T.mutD : T.mutL;
  return (
    <>
      {/* Top-left title block — wireframe region */}
      <Region code="R1" label="TITLE BLOCK" sub="LAB / PROJECT NUMBER / DATE" w={260} h={86} dark={dark}
        style={{ position:'absolute', top: 24, left: 24 }}>
        <div style={{ padding: '22px 12px 0 12px' }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing:'.22em', color: mut }}>[ LAB / 04 ]</div>
          <div style={{ fontFamily: T.display, fontWeight: 900, fontSize: 18, color: ink, letterSpacing:'-.01em', marginTop:2 }}>PENDULUM.</div>
        </div>
      </Region>

      {/* Top-right meta */}
      <Region code="R2" label="META" sub="θ / θ̇ / i  · live readout" w={240} h={86} dark={dark}
        style={{ position:'absolute', top: 24, right: 24 }}>
        <div style={{ padding:'22px 12px 0 12px', fontFamily: T.mono, fontSize: 10, color: ink, lineHeight:1.5 }}>
          <div>θ = 0.142 rad</div>
          <div>θ̇ = 0.31 rad/s</div>
          <div>i = 1.74 A</div>
        </div>
      </Region>

      {/* Bottom-center mode picker */}
      <Region code="R5" label="MODE PICKER" sub="3-pill segmented · keyboard 1/2/3" w={460} h={64} dark={dark}
        style={{ position:'absolute', bottom: 24, left:'50%', transform:'translateX(-50%)' }}>
        <div style={{ display:'flex', gap:10, justifyContent:'center', alignItems:'center', height:'100%', paddingTop: 12 }}>
          <ModePill dark={dark} num="01" label="KIT"    active={activeMode==='kit'} />
          <ModePill dark={dark} num="02" label="RUN"    active={activeMode==='run'} />
          <ModePill dark={dark} num="03" label="STUDIO" active={activeMode==='studio'} />
        </div>
      </Region>

      {/* Bottom-left section number — the [01]·KIT / [02]·RUN etc */}
      <Region code="R6" label="MODE NUM" w={210} h={64} dark={dark}
        style={{ position:'absolute', bottom: 24, left: 24 }}>
        <div style={{ padding:'14px 12px', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontFamily: T.mono, fontSize: 12, letterSpacing:'.22em', color: mut }}>[ {modeNumber} ]</div>
          <div style={{ display:'inline-block', width:16, height:1, background: mut }}/>
          <div style={{ fontFamily: T.display, fontWeight: 900, fontSize: 18, color: ink, letterSpacing:'-.01em' }}>{modeLabel}</div>
        </div>
      </Region>

      {/* Bottom-right help / sound */}
      <Region code="R7" label="HELP / RESET" w={150} h={64} dark={dark}
        style={{ position:'absolute', bottom: 24, right: 24 }}>
        <div style={{ padding:'18px 12px', fontFamily: T.mono, fontSize: 10, color: mut, letterSpacing:'.14em' }}>[?]&nbsp;&nbsp;[R]&nbsp;&nbsp;[↩]</div>
      </Region>
    </>
  );
}

// ─── W0 · LOADER ───────────────────────────────────────────────────────────────
function WFLoader() {
  return (
    <div style={{ position:'relative', width:'100%', height:'100%', background: T.inkD, color: T.txtD, overflow:'hidden' }}>
      <CuttingMat dark/>
      <Brackets color={T.txtD} inset={16} size={20}/>
      <div style={{ position:'absolute', top: 24, left: 24, fontFamily: T.mono, fontSize: 10, letterSpacing:'.22em', color: T.mutD }}>[ LAB / 04 ] · BOOTING</div>

      <Region code="L1" label="PROGRESS BAR" sub="linear · 4px high · accent fill" w={520} h={70} dark
        style={{ position:'absolute', top: '38%', left:'50%', transform:'translate(-50%,-50%)' }}>
        <div style={{ padding:'34px 16px 0' }}>
          <div style={{ height:4, background: T.hairD, position:'relative' }}>
            <div style={{ position:'absolute', left:0, top:0, height:'100%', width:'62%', background: T.accent }}/>
          </div>
          <div style={{ marginTop:8, display:'flex', justifyContent:'space-between', fontFamily: T.mono, fontSize: 10, color: T.mutD }}>
            <span>LOADING ASSETS</span><span>062%</span>
          </div>
        </div>
      </Region>

      <Region code="L2" label="ASSET MANIFEST" sub="✓ done · ↳ active · · pending" w={300} h={170} dark
        style={{ position:'absolute', top: '60%', left: 'calc(50% - 280px)' }}>
        <div style={{ padding:'24px 12px 8px', fontFamily: T.mono, fontSize: 10, color: T.mutD, lineHeight:1.65 }}>
          <div>✓ KIT.GLB</div>
          <div>✓ ROD.GLB</div>
          <div style={{ color: T.accent }}>↳ MAT.PNG · 38%</div>
          <div style={{ color: T.fntD }}>· PLOTS.JSON</div>
          <div style={{ color: T.fntD }}>· SHADER.GLSL</div>
        </div>
      </Region>

      <Region code="L3" label="POLE-ZERO DRAWING-IN" sub="syncs to progress · third pole flashes accent" w={260} h={170} dark
        style={{ position:'absolute', top: '60%', left: 'calc(50% + 20px)' }}>
        <div style={{ position:'absolute', inset:20, border:`1px dashed ${T.hairD}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.fntD }}>[ SVG · drawn 0 → 100% ]</div>
        </div>
      </Region>

      <div style={{ position:'absolute', bottom: 24, left: 24, fontFamily: T.mono, fontSize: 10, letterSpacing:'.18em', color: T.fntD }}>↳ AFTER 100% → AUTO ENTER [ KIT ]</div>
    </div>
  );
}

// ─── W1 · KIT ──────────────────────────────────────────────────────────────────
function WFKit() {
  return (
    <div style={{ position:'relative', width:'100%', height:'100%', background: T.inkD, color: T.txtD, overflow:'hidden' }}>
      <CuttingMat dark/>
      <Brackets color={T.txtD} inset={16} size={20}/>
      <PageChrome activeMode="kit" dark modeNumber="01" modeLabel="KIT."/>

      <Region code="K1" label="CANVAS — EXPLODED HARDWARE" sub="three.js · cutting-mat ground · ortho camera · parts labeled with leader lines" w={760} h={460} dark
        style={{ position:'absolute', top: 130, left:'50%', transform:'translateX(-50%)' }}>
        <div style={{ position:'absolute', inset: 22, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gridTemplateRows:'1fr 1fr', gap: 12 }}>
          {['ARDUINO UNO', 'MOTOR · RS-775', 'ENCODER', 'ROD + BOB', 'STANDS ×2', '12V BRICK'].map((p,i) => (
            <div key={i} style={{ border:`1px dashed ${T.hairD}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily: T.mono, fontSize: 10, color: T.mutD, letterSpacing:'.14em' }}>
              <span>[ {String(i+1).padStart(2,'0')} ] · {p}</span>
            </div>
          ))}
        </div>
      </Region>

      <Region code="K2" label="PART LIST" sub="hover-syncs with canvas" w={220} h={200} dark
        style={{ position:'absolute', top: 130, left: 24 }}>
        <div style={{ padding:'24px 12px 8px', fontFamily: T.mono, fontSize: 10, color: T.mutD, lineHeight:1.7 }}>
          <div>01 · UNO</div>
          <div>02 · RS-775</div>
          <div>03 · ENCODER</div>
          <div>04 · ROD + BOB</div>
          <div>05 · STANDS</div>
          <div>06 · 12V BRICK</div>
        </div>
      </Region>

      <Region code="K3" label="LEADER LINES" sub="SVG overlay · animated draw-in on enter" w={220} h={120} dark
        style={{ position:'absolute', top: 350, left: 24 }}/>

      <Region code="K4" label="HINT — `02 · RUN` →" sub="suggests next mode" w={220} h={64} dark
        style={{ position:'absolute', top: 484, left: 24 }}>
        <div style={{ padding:'14px 12px', fontFamily: T.mono, fontSize: 10, color: T.accent, letterSpacing:'.14em' }}>↳ ASSEMBLED IN [02 RUN]</div>
      </Region>
    </div>
  );
}

// ─── W2 · RUN ──────────────────────────────────────────────────────────────────
function WFRun() {
  return (
    <div style={{ position:'relative', width:'100%', height:'100%', background: T.inkD, color: T.txtD, overflow:'hidden' }}>
      <CuttingMat dark/>
      <Brackets color={T.txtD} inset={16} size={20}/>
      <PageChrome activeMode="run" dark modeNumber="02" modeLabel="RUN."/>

      <Region code="R-CANV" label="CANVAS — LIVE SIM" sub="three.js · assembled rig · pendulum swings up · 60fps · click-to-perturb hit-zone fills canvas" w={820} h={420} dark
        style={{ position:'absolute', top: 130, left:'50%', transform:'translateX(-50%)' }}>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily: T.mono, fontSize: 11, color: T.fntD, letterSpacing:'.22em' }}>[ THREE.JS · LIVE ODE / RK4 ]</div>
        <div style={{ position:'absolute', top: '50%', left:'50%', width: 220, height: 220, transform:'translate(-50%,-50%)', border:`1px dashed ${T.hairD}`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily: T.mono, fontSize: 9, color: T.fntD }}>HIT ZONE</div>
      </Region>

      <Region code="R-HUD" label="HUD — STATE + GAUGES" sub="θ angle dial · θ̇ bar · current bar · STATE chip" w={240} h={420} dark
        style={{ position:'absolute', top: 130, left: 24 }}>
        <div style={{ padding:'24px 12px', display:'flex', flexDirection:'column', gap: 14 }}>
          <div style={{ border:`1px dashed ${T.hairD}`, padding: 8 }}>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.mutD, letterSpacing:'.18em' }}>θ · ANGLE DIAL</div>
            <div style={{ height: 70, display:'flex', alignItems:'center', justifyContent:'center', fontFamily: T.mono, fontSize: 9, color: T.fntD }}>[ semicircle gauge ]</div>
          </div>
          <div style={{ border:`1px dashed ${T.hairD}`, padding: 8 }}>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.mutD, letterSpacing:'.18em' }}>θ̇ · ANGULAR VEL</div>
            <div style={{ height: 22, background: T.hairD, marginTop:6, position:'relative' }}>
              <div style={{ position:'absolute', left:'45%', top:0, bottom:0, width: '12%', background: T.accent }}/>
            </div>
          </div>
          <div style={{ border:`1px dashed ${T.hairD}`, padding: 8 }}>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.mutD, letterSpacing:'.18em' }}>i · MOTOR CURRENT</div>
            <div style={{ height: 22, background: T.hairD, marginTop:6, position:'relative' }}>
              <div style={{ position:'absolute', left:0, top:0, bottom:0, width: '34%', background: T.txtD }}/>
            </div>
          </div>
          <div style={{ border:`1px solid ${T.accent}`, padding: 8, color: T.accent, fontFamily: T.mono, fontSize: 10, letterSpacing:'.18em' }}>STATE · BALANCING</div>
        </div>
      </Region>

      <Region code="R-CTRL" label="PERTURB CONTROLS" sub="click anywhere on canvas · WASD nudges · slider sets torque magnitude · [FIRE]" w={240} h={420} dark
        style={{ position:'absolute', top: 130, right: 24 }}>
        <div style={{ padding:'24px 12px', display:'flex', flexDirection:'column', gap: 14 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.mutD, letterSpacing:'.18em' }}>KEYBOARD</div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.txtD, letterSpacing:'.08em', lineHeight:1.8 }}>
            <div>[W] PUSH UP</div>
            <div>[S] PUSH DOWN</div>
            <div>[A] LEFT NUDGE</div>
            <div>[D] RIGHT NUDGE</div>
            <div>[R] RESET</div>
          </div>
          <div style={{ height:1, background: T.hairD, margin:'6px 0' }}/>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.mutD, letterSpacing:'.18em' }}>TORQUE</div>
          <div style={{ height: 14, background: T.hairD, position:'relative' }}>
            <div style={{ position:'absolute', left: 0, top:0, bottom:0, width:'40%', background: T.txtD }}/>
            <div style={{ position:'absolute', left:'40%', top: -2, width: 4, height: 18, background: T.accent }}/>
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.mutD }}>0.40 N·m</div>
          <div style={{ marginTop: 6, padding:'8px 10px', border:`1px solid ${T.txtD}`, background: T.txtD, color: T.inkD, fontFamily: T.mono, fontSize: 10, letterSpacing:'.18em', textAlign:'center' }}>[ FIRE PERTURB ]</div>
        </div>
      </Region>
    </div>
  );
}

// ─── W3 · STUDIO · DIAGRAM ────────────────────────────────────────────────────
function WFStudioDiagram() {
  return (
    <div style={{ position:'relative', width:'100%', height:'100%', background: T.inkD, color: T.txtD, overflow:'hidden' }}>
      <CuttingMat dark/>
      <Brackets color={T.txtD} inset={16} size={20}/>
      <PageChrome activeMode="studio" dark modeNumber="03" modeLabel="STUDIO."/>

      {/* Studio sub-pills */}
      <Region code="S0" label="STUDIO SUB-PILLS · [D] [P] [M]" sub="Diagram default · keyboard D/P/M · multi-select allowed" w={360} h={56} dark
        style={{ position:'absolute', top: 130, left:'50%', transform:'translateX(-50%)' }}>
        <div style={{ display:'flex', gap: 8, justifyContent:'center', alignItems:'center', height:'100%', paddingTop:8 }}>
          <ModePill dark num="D" label="DIAGRAM" active/>
          <ModePill dark num="P" label="PLOTS"/>
          <ModePill dark num="M" label="MATH"/>
        </div>
      </Region>

      {/* Background cinematic canvas */}
      <Region code="S-BG" label="CINEMATIC SCENE — DIMMED" sub="three.js · low-key light · pendulum balancing · background depth-of-field" w={1100} h={400} dark
        style={{ position:'absolute', top: 200, left:'50%', transform:'translateX(-50%)', opacity:.6 }}/>

      {/* Big overlay panel — full cascade block diagram */}
      <Region code="S-D" label="[ DIAGRAM ] OVERLAY PANEL" sub="block diagrams cycle: Destabilizer · Full cascade · Position ctrl · Current ctrl" w={820} h={360} dark accent
        style={{ position:'absolute', top: 220, left:'50%', transform:'translateX(-50%)' }}>
        <div style={{ padding:'30px 20px 12px', display:'flex', flexDirection:'column', height:'100%' }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
            <div style={{ fontFamily: T.display, fontWeight: 900, fontSize: 22, letterSpacing:'-.01em' }}>FULL CASCADE.</div>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.mutD, letterSpacing:'.18em' }}>2 / 4  ← →</div>
          </div>
          <div style={{ flex:1, marginTop: 14, display:'grid', gridTemplateColumns:'1fr 24px 1fr 24px 1fr 24px 1fr', alignItems:'center', gap: 0 }}>
            {['r(t)', 'POS CTRL', 'CURR CTRL', 'PLANT'].map((b,i) => (
              <React.Fragment key={i}>
                <div style={{ border:`1px solid ${T.txtD}`, padding:'14px 8px', textAlign:'center', fontFamily: T.mono, fontSize: 10, letterSpacing:'.14em' }}>{b}</div>
                {i < 3 && <div style={{ display:'flex', alignItems:'center', justifyContent:'center', color: T.mutD, fontFamily: T.mono }}>→</div>}
              </React.Fragment>
            ))}
          </div>
          <div style={{ marginTop: 8, fontFamily: T.mono, fontSize: 9, color: T.fntD, letterSpacing:'.18em' }}>FEEDBACK ↑ θ, θ̇, i</div>
        </div>
      </Region>
    </div>
  );
}

// ─── W4 · STUDIO · PLOTS ───────────────────────────────────────────────────────
function WFStudioPlots() {
  return (
    <div style={{ position:'relative', width:'100%', height:'100%', background: T.inkD, color: T.txtD, overflow:'hidden' }}>
      <CuttingMat dark/>
      <Brackets color={T.txtD} inset={16} size={20}/>
      <PageChrome activeMode="studio" dark modeNumber="03" modeLabel="STUDIO."/>

      <Region code="S0" label="STUDIO SUB-PILLS" w={360} h={56} dark
        style={{ position:'absolute', top: 130, left:'50%', transform:'translateX(-50%)' }}>
        <div style={{ display:'flex', gap: 8, justifyContent:'center', alignItems:'center', height:'100%', paddingTop:8 }}>
          <ModePill dark num="D" label="DIAGRAM"/>
          <ModePill dark num="P" label="PLOTS" active/>
          <ModePill dark num="M" label="MATH"/>
        </div>
      </Region>

      <Region code="P1" label="[ PLOTS ] · POLE-ZERO MAP" sub="open-loop · 2 stable + 1 unstable pole · accent on +0.01" w={540} h={380} dark accent
        style={{ position:'absolute', top: 210, left: 60 }}>
        <div style={{ position:'absolute', inset: 30, display:'flex', alignItems:'center', justifyContent:'center', fontFamily: T.mono, fontSize: 10, color: T.fntD }}>[ SVG pole-zero plot ]</div>
        <div style={{ position:'absolute', top: 8, right: 12, fontFamily: T.mono, fontSize: 9, color: T.mutD }}>1 / 2</div>
      </Region>

      <Region code="P2" label="[ PLOTS ] · STEP RESPONSE" sub="closed-loop · θ(t) settles · overshoot %" w={540} h={380} dark accent
        style={{ position:'absolute', top: 210, right: 60 }}>
        <div style={{ position:'absolute', inset: 30, display:'flex', alignItems:'center', justifyContent:'center', fontFamily: T.mono, fontSize: 10, color: T.fntD }}>[ SVG step-response plot ]</div>
        <div style={{ position:'absolute', top: 8, right: 12, fontFamily: T.mono, fontSize: 9, color: T.mutD }}>2 / 2</div>
      </Region>

      <Region code="P3" label="PLOT TILES" sub="settle time · overshoot · ITAE" w={1100} h={56} dark
        style={{ position:'absolute', bottom: 110, left:'50%', transform:'translateX(-50%)' }}>
        <div style={{ display:'flex', gap: 10, padding: '8px 10px' }}>
          <Tile dark header="SETTLE" value="0.84 s" />
          <Tile dark header="OVERSHOOT" value="12%" />
          <Tile dark header="ITAE" value="0.31" />
          <Tile dark header="MARGIN" value="42°" accent />
        </div>
      </Region>
    </div>
  );
}

// ─── W5 · STUDIO · MATH ────────────────────────────────────────────────────────
function WFStudioMath() {
  return (
    <div style={{ position:'relative', width:'100%', height:'100%', background: T.inkD, color: T.txtD, overflow:'hidden' }}>
      <CuttingMat dark/>
      <Brackets color={T.txtD} inset={16} size={20}/>
      <PageChrome activeMode="studio" dark modeNumber="03" modeLabel="STUDIO."/>

      <Region code="S0" label="STUDIO SUB-PILLS" w={360} h={56} dark
        style={{ position:'absolute', top: 130, left:'50%', transform:'translateX(-50%)' }}>
        <div style={{ display:'flex', gap: 8, justifyContent:'center', alignItems:'center', height:'100%', paddingTop:8 }}>
          <ModePill dark num="D" label="DIAGRAM"/>
          <ModePill dark num="P" label="PLOTS"/>
          <ModePill dark num="M" label="MATH" active/>
        </div>
      </Region>

      <Region code="M1" label="[ MATH ] · EQUATIONS" sub="plant · destabilizer · PD law · numeric assignments" w={1100} h={420} dark accent
        style={{ position:'absolute', top: 210, left:'50%', transform:'translateX(-50%)' }}>
        <div style={{ padding:'30px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap: 22, height:'100%' }}>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.mutD, letterSpacing:'.18em' }}>↳ PLANT</div>
            <div style={{ fontFamily: T.serif, fontStyle:'italic', fontSize: 28, marginTop: 8 }}>J θ̈ + b θ̇  =  K·i + mgl sin(θ)</div>
            <div style={{ height: 12 }}/>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.mutD, letterSpacing:'.18em' }}>↳ DESTABILIZER</div>
            <div style={{ fontFamily: T.serif, fontStyle:'italic', fontSize: 26, marginTop: 8 }}>V  =  V<sub>max</sub> · sgn(θ̇)</div>
          </div>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.mutD, letterSpacing:'.18em' }}>↳ PD CONTROL</div>
            <div style={{ fontFamily: T.serif, fontStyle:'italic', fontSize: 28, marginTop: 8 }}>θ̈<sub>c</sub>  =  −K<sub>p</sub>·θ  −  K<sub>d</sub>·θ̇</div>
            <div style={{ height: 12 }}/>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.mutD, letterSpacing:'.18em' }}>↳ GAINS · POLES</div>
            <div style={{ fontFamily: T.mono, fontSize: 12, lineHeight: 1.8, marginTop:8, color: T.txtD }}>
              <div>K<sub>p</sub> = 196 &nbsp;&nbsp; K<sub>d</sub> = 28 &nbsp;&nbsp; K<sub>p,i</sub> = 446</div>
              <div>poles: <span>−14.27 ·  −2.94 · </span><span style={{ color: T.accent }}>+0.01</span></div>
            </div>
          </div>
        </div>
      </Region>
    </div>
  );
}

// ─── W6 · MOBILE FALLBACK ─────────────────────────────────────────────────────
function WFMobile() {
  return (
    <div style={{ position:'relative', width:'100%', height:'100%', background: T.inkD, color: T.txtD, overflow:'hidden' }}>
      <CuttingMat dark/>
      <Brackets color={T.txtD} inset={10} size={12}/>
      <div style={{ position:'absolute', top: 18, left: 16, fontFamily: T.mono, fontSize: 9, letterSpacing:'.22em', color: T.mutD }}>[ LAB / 04 ]</div>
      <div style={{ position:'absolute', top: 30, left: 16, fontFamily: T.display, fontWeight: 900, fontSize: 14 }}>PENDULUM.</div>

      <Region code="M1" label="HERO STILL" sub="frame from desktop · static png · no three.js" w={356} h={200} dark
        style={{ position:'absolute', top: 80, left: 16 }}/>

      <Region code="M2" label="TEXT WALKTHROUGH" sub="Kit → Run → Studio · scrollable · equations rendered as SVG" w={356} h={280} dark
        style={{ position:'absolute', top: 296, left: 16 }}>
        <div style={{ padding:'22px 12px', fontFamily: T.mono, fontSize: 10, color: T.txtD, lineHeight:1.7 }}>
          <div style={{ color: T.mutD, letterSpacing:'.18em' }}>[ 01 ] · KIT</div>
          <div>Arduino · RS-775 · encoder · rod + bob.</div>
          <div style={{ height: 8 }}/>
          <div style={{ color: T.mutD, letterSpacing:'.18em' }}>[ 02 ] · RUN</div>
          <div>Swing-up → balance. PD holds θ ≈ 0.</div>
        </div>
      </Region>

      <Region code="M3" label="CTA → DESKTOP" sub="invite to view full demo on desktop" w={356} h={80} dark accent
        style={{ position:'absolute', bottom: 24, left: 16 }}>
        <div style={{ padding:'28px 16px', fontFamily: T.mono, fontSize: 10, color: T.accent, letterSpacing:'.16em' }}>↳ OPEN ON DESKTOP FOR LIVE DEMO</div>
      </Region>
    </div>
  );
}

Object.assign(window, { WFLoader, WFKit, WFRun, WFStudioDiagram, WFStudioPlots, WFStudioMath, WFMobile });
