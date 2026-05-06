// ═══════════════════════════════════════════════════════════
// NEXUS · Mission Control Icons & Illustrations
// All SVG, dark-theme optimised
// ═══════════════════════════════════════════════════════════

// ── Logo mark ────────────────────────────────────────────
export function NexusLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="rgba(170,255,62,0.12)" stroke="rgba(170,255,62,0.3)" strokeWidth="1"/>
      <circle cx="20" cy="10" r="5" fill="#AAFF3E"/>
      <circle cx="10" cy="28" r="5" fill="#AAFF3E"/>
      <circle cx="30" cy="28" r="5" fill="#AAFF3E"/>
      <rect x="17.5" y="10" width="5" height="18" fill="#AAFF3E"/>
      <rect x="10" y="25.5" width="20" height="5" fill="#AAFF3E"/>
    </svg>
  )
}

// ── Splash hero — orbital network ────────────────────────
export function HeroIllustration() {
  return (
    <svg viewBox="0 0 340 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 340 }}>
      {/* Outer orbital ring */}
      <ellipse cx="170" cy="130" rx="130" ry="100" stroke="rgba(170,255,62,0.08)" strokeWidth="1"/>
      <ellipse cx="170" cy="130" rx="95"  ry="72"  stroke="rgba(170,255,62,0.12)" strokeWidth="1"/>
      <ellipse cx="170" cy="130" rx="58"  ry="44"  stroke="rgba(170,255,62,0.18)" strokeWidth="1.5"/>

      {/* Rotating accent arcs */}
      <path d="M 90 65 A 95 72 0 0 1 250 65" stroke="rgba(170,255,62,0.35)" strokeWidth="1.5" fill="none" strokeDasharray="6 4"/>
      <path d="M 250 195 A 95 72 0 0 1 90 195" stroke="rgba(0,229,204,0.25)" strokeWidth="1" fill="none" strokeDasharray="4 6"/>

      {/* Center glow */}
      <circle cx="170" cy="130" r="34" fill="rgba(170,255,62,0.08)"/>
      <circle cx="170" cy="130" r="22" fill="rgba(170,255,62,0.12)"/>
      <circle cx="170" cy="130" r="13" fill="#AAFF3E" opacity="0.9"/>
      <path d="M163 130L167 134L177 124" stroke="#04080F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Satellite nodes */}
      {[
        { cx: 72,  cy: 82,  r: 16, color: '#AAFF3E', label: '💰', lx: 72,  ly: 87  },
        { cx: 268, cy: 82,  r: 16, color: '#00E5CC', label: '📊', lx: 268, ly: 87  },
        { cx: 52,  cy: 165, r: 14, color: '#FFB800', label: '💡', lx: 52,  ly: 170 },
        { cx: 288, cy: 165, r: 14, color: '#FF4D6A', label: '🎯', lx: 288, ly: 170 },
        { cx: 170, cy: 40,  r: 13, color: '#AAFF3E', label: '🚀', lx: 170, ly: 45  },
        { cx: 170, cy: 220, r: 13, color: '#00E5CC', label: '🗺️', lx: 170, ly: 225 },
      ].map(({ cx, cy, r, color, label, lx, ly }) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r={r+6} fill={`${color}10`}/>
          <circle cx={cx} cy={cy} r={r} fill={`${color}18`} stroke={`${color}50`} strokeWidth="1"/>
          <text x={lx} y={ly} textAnchor="middle" fontSize="13">{label}</text>
        </g>
      ))}

      {/* Connector lines */}
      {[
        [170-13, 130, 72+16,  82],
        [170+13, 130, 268-16, 82],
        [170-13, 130, 52+14,  165],
        [170+13, 130, 288-14, 165],
        [170,    130-13, 170, 40+13],
        [170,    130+13, 170, 220-13],
      ].map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(170,255,62,0.2)" strokeWidth="1" strokeDasharray="4 3"/>
      ))}

      {/* Floating data points */}
      {[[115,55],[225,55],[100,185],[240,185],[135,215],[205,215]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="2" fill="rgba(170,255,62,0.3)"/>
      ))}
    </svg>
  )
}

// ── Generating animation ──────────────────────────────────
export function GeneratingIllustration() {
  return (
    <div style={{ position: 'relative', width: 88, height: 88 }}>
      {/* Outer ring */}
      <svg width="88" height="88" viewBox="0 0 88 88" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="44" cy="44" r="40" stroke="rgba(170,255,62,0.15)" strokeWidth="2" fill="none"/>
        <circle cx="44" cy="44" r="40" stroke="#AAFF3E" strokeWidth="2" fill="none"
          strokeDasharray="50 202" strokeLinecap="round"
          style={{ transformOrigin: '44px 44px', animation: 'spin 1.3s linear infinite' }}/>
      </svg>
      {/* Mid ring */}
      <svg width="88" height="88" viewBox="0 0 88 88" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="44" cy="44" r="28" stroke="rgba(0,229,204,0.2)" strokeWidth="1.5" fill="none"
          strokeDasharray="30 146" strokeLinecap="round"
          style={{ transformOrigin: '44px 44px', animation: 'spin 0.9s linear infinite reverse' }}/>
      </svg>
      {/* Center */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <NexusLogo size={30} />
      </div>
    </div>
  )
}

// ── Idea glyphs — 6 unique SVG shapes ────────────────────
type GlyphFn = (size: number) => JSX.Element
const GLYPHS: GlyphFn[] = [
  // Bolt
  (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13Z" fill="#AAFF3E"/>
  </svg>,
  // Target
  (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="#00E5CC" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="5" stroke="#00E5CC" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="2" fill="#00E5CC"/>
  </svg>,
  // Trend
  (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M3 17L9 11L13 15L21 7" stroke="#AAFF3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 7H21V12" stroke="#AAFF3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  // Stack
  (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L22 7L12 12L2 7Z" stroke="#FFB800" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="#FFB800" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 17L12 22L22 17" stroke="#FFB800" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
  </svg>,
  // Hex
  (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L20.5 7V17L12 22L3.5 17V7Z" stroke="#00E5CC" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    <path d="M12 8L16.3 10.5V15.5L12 18L7.7 15.5V10.5Z" fill="rgba(0,229,204,0.15)"/>
  </svg>,
  // Star
  (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L14.9 9.3H22.5L16.3 13.8L18.6 21.2L12 16.8L5.4 21.2L7.7 13.8L1.5 9.3H9.1Z"
      stroke="#FF4D6A" strokeWidth="1.5" fill="rgba(255,77,106,0.1)" strokeLinejoin="round"/>
  </svg>,
]

export function IdeaGlyph({ index, size = 20 }: { index: number; size?: number }) {
  const G = GLYPHS[index % GLYPHS.length]
  return <>{G(size)}</>
}

// ── Score ring ────────────────────────────────────────────
export function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r     = (size - 8) / 2
  const circ  = 2 * Math.PI * r
  const dash  = (score / 100) * circ
  const color = score >= 80 ? '#AAFF3E' : score >= 60 ? '#00E5CC' : '#FFB800'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="score-ring-lime">
      <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="none"/>
      <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="4" fill="none"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 0.8s var(--ease)' }}/>
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fontSize={size < 48 ? 11 : 13} fontWeight="700"
        fontFamily="Syne Mono, monospace" fill={color}>{score}</text>
    </svg>
  )
}

// ── Mini bar chart ────────────────────────────────────────
export function MiniBarChart({ pess, base, opt }: { pess: number; base: number; opt: number }) {
  const max = Math.max(Math.abs(pess), Math.abs(base), Math.abs(opt), 1)
  const H = 44; const W = 24
  function bar(val: number, x: number, c: string) {
    const pos = val >= 0
    const h   = (Math.abs(val) / max) * H
    return (
      <g key={x}>
        <rect x={x} y={pos ? H - h : H} width={W} height={h} rx="3"
          fill={c} opacity="0.8"/>
      </g>
    )
  }
  return (
    <svg viewBox={`0 0 ${W*3+16} ${H+4}`} style={{ overflow: 'visible' }}>
      <line x1="0" y1={H} x2={W*3+16} y2={H} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      {bar(pess, 0,        pess < 0 ? '#FF4D6A' : '#AAFF3E')}
      {bar(base, W+8,     base < 0 ? '#FF4D6A' : '#AAFF3E')}
      {bar(opt,  W*2+16,  opt  < 0 ? '#FF4D6A' : '#00E5CC')}
    </svg>
  )
}

// ── Arrow / chevron ───────────────────────────────────────
export function ArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function ChevronLeft({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Validation illustration ───────────────────────────────
export function ValidationIllustration() {
  return (
    <svg viewBox="0 0 300 160" fill="none" style={{ width: '100%', maxWidth: 300 }}>
      {/* Columns */}
      {[
        { x: 20,  h: 100, color: '#AAFF3E', label: 'Гипотезы' },
        { x: 115, h: 120, color: '#00E5CC', label: 'CustDev' },
        { x: 210, h: 85,  color: '#FFB800', label: 'MVP' },
      ].map(({ x, h, color, label }) => (
        <g key={x}>
          <rect x={x} y={155-h} width={70} height={h} rx="8"
            fill={`${color}12`} stroke={`${color}30`} strokeWidth="1"/>
          {/* Check */}
          <circle cx={x+35} cy={155-h+20} r={11} fill={`${color}25`} stroke={`${color}60`} strokeWidth="1"/>
          <path d={`M${x+29} ${155-h+20}L${x+33} ${155-h+24}L${x+41} ${155-h+16}`}
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <text x={x+35} y={148} textAnchor="middle"
            fontSize="10" fill={color} fontFamily="Syne, sans-serif" fontWeight="700">
            {label}
          </text>
        </g>
      ))}
      {/* Connecting line */}
      <path d="M90 100 Q150 80 210 105" stroke="rgba(170,255,62,0.2)" strokeWidth="1" strokeDasharray="4 3" fill="none"/>
    </svg>
  )
}

// ── Roadmap illustration ──────────────────────────────────
export function RoadmapIllustration() {
  return (
    <svg viewBox="0 0 300 170" fill="none" style={{ width: '100%', maxWidth: 300 }}>
      {/* Spine */}
      <line x1="30" y1="16" x2="30" y2="155" stroke="rgba(170,255,62,0.2)" strokeWidth="1.5" strokeDasharray="4 3"/>

      {[
        { y: 28,  color: '#AAFF3E', phase: 'Фаза 1',  title: 'Фундамент',      weeks: '1–4' },
        { y: 82,  color: '#00E5CC', phase: 'Фаза 2',  title: 'Первые продажи', weeks: '5–8' },
        { y: 136, color: '#FFB800', phase: 'Фаза 3',  title: 'Оптимизация',   weeks: '9–12' },
      ].map(({ y, color, phase, title, weeks }) => (
        <g key={y}>
          <circle cx="30" cy={y} r="8" fill={`${color}20`} stroke={`${color}60`} strokeWidth="1.5"/>
          <circle cx="30" cy={y} r="4" fill={color}/>
          <rect x="48" y={y-18} width="234" height="36" rx="8"
            fill={`${color}08`} stroke={`${color}20`} strokeWidth="1"/>
          <text x="60" y={y-4} fontSize="9" fill={color}
            fontFamily="Syne, sans-serif" fontWeight="700" letterSpacing="0.08em">
            {phase} · НЕД {weeks}
          </text>
          <text x="60" y={y+11} fontSize="12" fill="rgba(240,244,255,0.85)"
            fontFamily="Syne, sans-serif" fontWeight="600">{title}</text>
        </g>
      ))}
    </svg>
  )
}

// ── Category icon ─────────────────────────────────────────
export function CategoryIcon({ cat, size = 14 }: { cat: string; size?: number }) {
  const m: Record<string, string> = { legal:'⚖️', finance:'💰', marketing:'📣', ops:'⚙️', hiring:'👥', product:'🛠️' }
  return <span style={{ fontSize: size }}>{m[cat] || '📌'}</span>
}
