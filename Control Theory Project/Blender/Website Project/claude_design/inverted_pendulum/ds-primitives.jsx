// Shared primitives for the system + wireframe artboards.
// All artboards use this — keep tokens here, not inline.

const T = {
  inkD: '#0E0E0C',
  inkD2: '#16160F',
  inkD3: '#1F1E15',
  inkL: '#F5F3EE',
  inkL2: '#EAE6DE',
  txtD: '#F4F1E8',
  txtL: '#0A0A08',
  mutD: 'rgba(244,241,232,.55)',
  fntD: 'rgba(244,241,232,.32)',
  mutL: 'rgba(10,10,8,.55)',
  fntL: 'rgba(10,10,8,.30)',
  accent: '#D4FF3A',
  accentDim: '#B7DD2C',
  warn: '#FF6A3D',
  hairD: 'rgba(244,241,232,.14)',
  hairL: 'rgba(10,10,8,.14)',
  display: "'Geist', system-ui, sans-serif",
  serif: "'Instrument Serif', 'Times New Roman', serif",
  mono: "'Geist Mono', ui-monospace, monospace",
};

// Bracket corner chrome — the signature [ ] motif scaled to a container.
// `size` is the bracket arm length in px; `inset` is offset from the corner.
function Brackets({ color = T.txtD, size = 14, inset = 8, weight = 1.25, style = {} }) {
  const armStyle = { position:'absolute', background: color };
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', ...style }}>
      {/* TL */}
      <div style={{ ...armStyle, top: inset, left: inset, width: size, height: weight }}/>
      <div style={{ ...armStyle, top: inset, left: inset, width: weight, height: size }}/>
      {/* TR */}
      <div style={{ ...armStyle, top: inset, right: inset, width: size, height: weight }}/>
      <div style={{ ...armStyle, top: inset, right: inset, width: weight, height: size }}/>
      {/* BL */}
      <div style={{ ...armStyle, bottom: inset, left: inset, width: size, height: weight }}/>
      <div style={{ ...armStyle, bottom: inset, left: inset, width: weight, height: size }}/>
      {/* BR */}
      <div style={{ ...armStyle, bottom: inset, right: inset, width: size, height: weight }}/>
      <div style={{ ...armStyle, bottom: inset, right: inset, width: weight, height: size }}/>
    </div>
  );
}

// Crosshair tick — a + at a point
function Crosshair({ color = T.txtD, size = 10, weight = 1, style = {} }) {
  return (
    <div style={{ position:'relative', width:size, height:size, ...style }}>
      <div style={{ position:'absolute', left:0, right:0, top:'50%', height:weight, background:color, transform:'translateY(-50%)' }}/>
      <div style={{ position:'absolute', top:0, bottom:0, left:'50%', width:weight, background:color, transform:'translateX(-50%)' }}/>
    </div>
  );
}

// Cutting-mat grid background — light or dark variant
function CuttingMat({ dark = false, step = 24, style = {} }) {
  const line = dark ? 'rgba(244,241,232,.05)' : 'rgba(10,10,8,.07)';
  const major = dark ? 'rgba(244,241,232,.10)' : 'rgba(10,10,8,.13)';
  return (
    <div style={{
      position:'absolute', inset:0, pointerEvents:'none',
      backgroundImage: [
        `linear-gradient(${line} 1px, transparent 1px)`,
        `linear-gradient(90deg, ${line} 1px, transparent 1px)`,
        `linear-gradient(${major} 1px, transparent 1px)`,
        `linear-gradient(90deg, ${major} 1px, transparent 1px)`,
      ].join(','),
      backgroundSize: `${step}px ${step}px, ${step}px ${step}px, ${step*5}px ${step*5}px, ${step*5}px ${step*5}px`,
      ...style,
    }}/>
  );
}

// Frame card with bracket chrome — surface for an artboard or panel mock
function Frame({ dark = false, padding = 24, children, style = {}, withBrackets = true, withMat = false }) {
  const bg = dark ? T.inkD : T.inkL;
  const ink = dark ? T.txtD : T.txtL;
  return (
    <div style={{
      position:'relative', width:'100%', height:'100%',
      background: bg, color: ink,
      fontFamily: T.mono,
      overflow:'hidden',
      ...style
    }}>
      {withMat && <CuttingMat dark={dark}/>}
      {withBrackets && <Brackets color={dark ? T.txtD : T.txtL} inset={10} size={12} weight={1}/>}
      <div style={{ position:'relative', padding, height:'100%' }}>{children}</div>
    </div>
  );
}

// Section header — "01 · KIT" mono label + display title
function SectionHead({ num, label, title, dark = false, accent = false, sub }) {
  const mut = dark ? T.mutD : T.mutL;
  const ink = dark ? T.txtD : T.txtL;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontFamily: T.mono, fontSize: 10, letterSpacing:'.18em', textTransform:'uppercase',
        color: mut, display:'flex', alignItems:'center', gap:8
      }}>
        <span>[ {num} ]</span>
        <span style={{ display:'inline-block', width:8, height:1, background: mut }}/>
        <span>{label}</span>
      </div>
      <div style={{
        fontFamily: T.display, fontWeight: 900, fontSize: 28, lineHeight: 1.0,
        letterSpacing:'-.01em', marginTop: 6, color: accent ? T.accent : ink,
      }}>{title}</div>
      {sub && <div style={{ fontFamily: T.mono, fontSize: 11, color: mut, marginTop: 8, letterSpacing:'.02em' }}>{sub}</div>}
    </div>
  );
}

// Mono tile — uppercase header + bold value (matches portfolio EDUCATION tiles)
function Tile({ header, value, sub, dark = false, accent = false, w }) {
  const mut = dark ? T.mutD : T.mutL;
  const ink = dark ? T.txtD : T.txtL;
  const hair = dark ? T.hairD : T.hairL;
  return (
    <div style={{
      flex: w ? `0 0 ${w}` : '1 1 0', minWidth: 0,
      padding: '10px 12px',
      border: `1px solid ${hair}`,
      background: 'transparent',
      position:'relative',
    }}>
      <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing:'.18em', textTransform:'uppercase', color: mut }}>{header}</div>
      <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 16, marginTop: 4, color: accent ? T.accent : ink, letterSpacing:'-.005em' }}>{value}</div>
      {sub && <div style={{ fontFamily: T.mono, fontSize: 9, color: mut, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// Mono label row — "KEY ········ VALUE"
function KV({ k, v, dark = false, accent = false }) {
  const mut = dark ? T.mutD : T.mutL;
  const ink = dark ? T.txtD : T.txtL;
  return (
    <div style={{ display:'flex', alignItems:'baseline', gap:8, fontFamily: T.mono, fontSize: 11, lineHeight: 1.6 }}>
      <span style={{ color: mut, letterSpacing:'.1em', textTransform:'uppercase' }}>{k}</span>
      <span style={{ flex: 1, borderBottom: `1px dashed ${dark ? T.hairD : T.hairL}`, transform:'translateY(-3px)' }}/>
      <span style={{ color: accent ? T.accent : ink }}>{v}</span>
    </div>
  );
}

// Region — labeled rectangular zone for wireframes
function Region({ label, code, sub, h, w, dark = false, dashed = true, accent = false, children, style = {} }) {
  const ink = dark ? T.txtD : T.txtL;
  const mut = dark ? T.mutD : T.mutL;
  const hair = dark ? T.hairD : T.hairL;
  return (
    <div style={{
      position:'relative',
      border: `1px ${dashed ? 'dashed' : 'solid'} ${accent ? T.accent : hair}`,
      background: dark ? 'rgba(244,241,232,.02)' : 'rgba(10,10,8,.015)',
      width: w, height: h,
      minWidth: 0, minHeight: 0,
      ...style,
    }}>
      {(code || label) && (
        <div style={{ position:'absolute', top: 6, left: 8, display:'flex', alignItems:'center', gap:8 }}>
          {code && <span style={{
            fontFamily: T.mono, fontSize: 9, letterSpacing:'.14em',
            color: accent ? T.accent : mut, background: dark ? T.inkD : T.inkL, padding:'1px 4px'
          }}>{code}</span>}
          {label && <span style={{ fontFamily: T.mono, fontSize: 10, color: ink, letterSpacing:'.04em' }}>{label}</span>}
        </div>
      )}
      {sub && <div style={{
        position:'absolute', bottom: 6, left: 8, fontFamily: T.mono, fontSize: 9, color: mut, letterSpacing:'.04em'
      }}>{sub}</div>}
      <div style={{ position:'relative', width:'100%', height:'100%' }}>{children}</div>
    </div>
  );
}

// Mode pill — the [ KIT ] / [ RUN ] / [ STUDIO ] picker
function ModePill({ label, active = false, dark = false, num, hover = false }) {
  const ink = dark ? T.txtD : T.txtL;
  const mut = dark ? T.mutD : T.mutL;
  const hair = dark ? T.hairD : T.hairL;
  const bgActive = dark ? T.txtD : T.txtL;
  const fgActive = dark ? T.inkD : T.inkL;
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:8,
      padding:'8px 14px',
      border: `1px solid ${active ? (dark ? T.txtD : T.txtL) : hair}`,
      background: active ? bgActive : (hover ? (dark ? 'rgba(244,241,232,.04)' : 'rgba(10,10,8,.04)') : 'transparent'),
      color: active ? fgActive : ink,
      fontFamily: T.mono, fontSize: 11, letterSpacing:'.16em', textTransform:'uppercase',
      transition:'all .18s ease',
      cursor:'pointer', userSelect:'none',
    }}>
      <span style={{ color: active ? fgActive : mut, fontSize:9 }}>{num}</span>
      <span>[ {label} ]</span>
    </div>
  );
}

window.T = T;
Object.assign(window, { Brackets, Crosshair, CuttingMat, Frame, SectionHead, Tile, KV, Region, ModePill });
