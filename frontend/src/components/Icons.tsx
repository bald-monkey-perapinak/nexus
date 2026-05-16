// ═══════════════════════════════════════════════════════════
// NEXUS · Holographic Edition — Icons & Illustrations
// New logo: geometric "nexus" wordmark with lightning slash
// ═══════════════════════════════════════════════════════════

// ── Logo mark — matches uploaded geometric "nexus" wordmark ──
export function NexusLogo({ size = 36 }: { size?: number }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="11" fill="rgba(0,245,233,0.08)" stroke="rgba(0,245,233,0.25)" strokeWidth="1"/>
      {/* N */}
      <path d="M6 10 L6 22 L10 22 L10 14 L14 22 L18 22 L18 10 L14 10 L14 18 L10 10 Z" fill="#00F5E9"/>
      {/* E */}
      <path d="M20 10 L20 22 L30 22 L30 19 L23 19 L23 17 L28 17 L28 14 L23 14 L23 13 L30 13 L30 10 Z" fill="#00F5E9"/>
      {/* Lightning bolt / slash accent */}
      <path d="M34 22 L28 33 L32 33 L26 44" stroke="#B8FF3E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M32 22 L26 33 L30 33 L24 44" stroke="rgba(184,255,62,0.3)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}

// ── Full wordmark logo (for splash) ──────────────────────
export function NexusWordmark({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 220 120" fill="none">
      {/* NEX — top row */}
      {/* N */}
      <path d="M8 8 L8 52 L22 52 L22 28 L38 52 L52 52 L52 8 L38 8 L38 32 L22 8 Z" fill="white"/>
      {/* E */}
      <path d="M60 8 L60 52 L100 52 L100 40 L74 40 L74 33 L94 33 L94 21 L74 21 L74 20 L100 20 L100 8 Z" fill="white"/>
      {/* X */}
      <path d="M108 8 L124 30 L108 52 L126 52 L136 37 L146 52 L164 52 L148 30 L164 8 L146 8 L136 23 L126 8 Z" fill="white"/>

      {/* US — bottom row */}
      {/* U */}
      <path d="M8 64 L8 95 Q8 112 28 112 L44 112 Q64 112 64 95 L64 64 L50 64 L50 94 Q50 98 44 98 L28 98 Q22 98 22 94 L22 64 Z" fill="white"/>
      {/* S */}
      <path d="M72 64 L72 76 L104 76 L104 84 L72 84 L72 112 L116 112 L116 100 L86 100 L86 96 L116 96 L116 64 Z" fill="white"/>

      {/* Lightning slash */}
      <path d="M130 92 L112 120" stroke="#00F5E9" strokeWidth="5" strokeLinecap="round"/>
      <path d="M128 88 L108 116" stroke="rgba(0,245,233,0.25)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// ── Inline NexusLogo variant for header ──────────────────
export function NexusLogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="14" fill="rgba(0,245,233,0.07)" stroke="rgba(0,245,233,0.22)" strokeWidth="1.2"/>
      {/* N letter */}
      <path d="M8 14 L8 38 L14 38 L14 24 L22 38 L28 38 L28 14 L22 14 L22 28 L14 14 Z" fill="#00F5E9"/>
      {/* simplified E */}
      <path d="M31 14 L31 38 L50 38 L50 33 L37 33 L37 28 L47 28 L47 22 L37 22 L37 19 L50 19 L50 14 Z" fill="#00F5E9"/>
      {/* slash */}
      <path d="M44 38 L36 52" stroke="#B8FF3E" strokeWidth="3" strokeLinecap="round"/>
      <path d="M50 38 L42 52" stroke="rgba(184,255,62,0.25)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// ── Splash hero — holographic orbital ────────────────────
export function HeroIllustration() {
  return (
    <svg viewBox="0 0 340 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 340 }}>
      <defs>
        <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00F5E9" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#00F5E9" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="glow2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#B8FF3E" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#B8FF3E" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* Orbital rings */}
      <ellipse cx="170" cy="130" rx="128" ry="98" stroke="rgba(0,245,233,0.08)" strokeWidth="1"/>
      <ellipse cx="170" cy="130" rx="93" ry="70" stroke="rgba(0,245,233,0.13)" strokeWidth="1"/>
      <ellipse cx="170" cy="130" rx="56" ry="42" stroke="rgba(0,245,233,0.20)" strokeWidth="1.5"/>

      {/* Rotating arcs */}
      <path d="M 88 62 A 95 70 0 0 1 252 62" stroke="rgba(0,245,233,0.4)" strokeWidth="1.5" fill="none" strokeDasharray="8 5"/>
      <path d="M 252 198 A 95 70 0 0 1 88 198" stroke="rgba(184,255,62,0.25)" strokeWidth="1" fill="none" strokeDasharray="5 7"/>

      {/* Center glow */}
      <circle cx="170" cy="130" r="38" fill="url(#glow1)"/>
      <circle cx="170" cy="130" r="24" fill="rgba(0,245,233,0.10)"/>
      <circle cx="170" cy="130" r="14" fill="#00F5E9" opacity="0.92"/>
      <path d="M163 130L167 134L178 123" stroke="#040810" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Satellite nodes */}
      {[
        { cx: 70,  cy: 80,  r: 16, color: '#00F5E9', label: '💰' },
        { cx: 270, cy: 80,  r: 16, color: '#B8FF3E', label: '📊' },
        { cx: 50,  cy: 165, r: 14, color: '#FFB830', label: '💡' },
        { cx: 290, cy: 165, r: 14, color: '#FF4D8A', label: '🎯' },
        { cx: 170, cy: 38,  r: 13, color: '#00F5E9', label: '🚀' },
        { cx: 170, cy: 222, r: 13, color: '#B8FF3E', label: '🗺️' },
      ].map(({ cx, cy, r, color, label }) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r={r+8} fill={`${color}08`}/>
          <circle cx={cx} cy={cy} r={r} fill={`${color}14`} stroke={`${color}50`} strokeWidth="1.2"/>
          <text x={cx} y={cy+5} textAnchor="middle" fontSize="13">{label}</text>
        </g>
      ))}

      {/* Connectors */}
      {[
        [170-14, 130, 70+16, 80],
        [170+14, 130, 270-16, 80],
        [170-14, 130, 50+14, 165],
        [170+14, 130, 290-14, 165],
        [170, 130-14, 170, 38+13],
        [170, 130+14, 170, 222-13],
      ].map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(0,245,233,0.18)" strokeWidth="1" strokeDasharray="4 3"/>
      ))}

      {/* Floating dots */}
      {[[113,53],[227,53],[98,185],[242,185],[133,215],[207,215]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="rgba(0,245,233,0.35)"/>
      ))}
    </svg>
  )
}

// ── Generating animation ──────────────────────────────────
export function GeneratingIllustration() {
  return (
    <div style={{ position: 'relative', width: 88, height: 88 }}>
      <svg width="88" height="88" viewBox="0 0 88 88" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="44" cy="44" r="40" stroke="rgba(0,245,233,0.12)" strokeWidth="2" fill="none"/>
        <circle cx="44" cy="44" r="40" stroke="#00F5E9" strokeWidth="2" fill="none"
          strokeDasharray="55 195" strokeLinecap="round"
          style={{ transformOrigin: '44px 44px', animation: 'spin 1.3s linear infinite' }}/>
      </svg>
      <svg width="88" height="88" viewBox="0 0 88 88" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="44" cy="44" r="28" stroke="rgba(184,255,62,0.2)" strokeWidth="1.5" fill="none"
          strokeDasharray="30 146" strokeLinecap="round"
          style={{ transformOrigin: '44px 44px', animation: 'spin 0.9s linear infinite reverse' }}/>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <NexusLogoMark size={30} />
      </div>
    </div>
  )
}

// ── Idea glyphs ───────────────────────────────────────────
type GlyphFn = (size: number) => JSX.Element
const GLYPHS: GlyphFn[] = [
  (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13Z" fill="#00F5E9"/>
  </svg>,
  (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="#B8FF3E" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="5" stroke="#B8FF3E" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="2" fill="#B8FF3E"/>
  </svg>,
  (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M3 17L9 11L13 15L21 7" stroke="#00F5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 7H21V12" stroke="#00F5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L22 7L12 12L2 7Z" stroke="#FFB830" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="#FFB830" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 17L12 22L22 17" stroke="#FFB830" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
  </svg>,
  (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L20.5 7V17L12 22L3.5 17V7Z" stroke="#00F5E9" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    <path d="M12 8L16.3 10.5V15.5L12 18L7.7 15.5V10.5Z" fill="rgba(0,245,233,0.15)"/>
  </svg>,
  (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L14.9 9.3H22.5L16.3 13.8L18.6 21.2L12 16.8L5.4 21.2L7.7 13.8L1.5 9.3H9.1Z"
      stroke="#FF4D8A" strokeWidth="1.5" fill="rgba(255,77,138,0.1)" strokeLinejoin="round"/>
  </svg>,
]

export function IdeaGlyph({ index, size = 20 }: { index: number; size?: number }) {
  return <>{GLYPHS[index % GLYPHS.length](size)}</>
}

// ── Score ring ────────────────────────────────────────────
export function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r    = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 80 ? '#00F5E9' : score >= 60 ? '#B8FF3E' : '#FFB830'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="score-ring-cyan">
      <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="none"/>
      <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="4" fill="none"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 0.8s var(--ease)' }}/>
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fontSize={size < 48 ? 11 : 13} fontWeight="700"
        fontFamily="JetBrains Mono, monospace" fill={color}>{score}</text>
    </svg>
  )
}

// ── Mini bar chart ────────────────────────────────────────
export function MiniBarChart({ pess, base, opt }: { pess: number; base: number; opt: number }) {
  const max = Math.max(Math.abs(pess), Math.abs(base), Math.abs(opt), 1)
  const H = 44; const W = 24
  function bar(val: number, x: number, c: string) {
    const h = (Math.abs(val) / max) * H
    return (
      <g key={x}>
        <rect x={x} y={val >= 0 ? H - h : H} width={W} height={h} rx="3"
          fill={c} opacity="0.85"/>
      </g>
    )
  }
  return (
    <svg viewBox={`0 0 ${W*3+16} ${H+4}`} style={{ overflow: 'visible' }}>
      <line x1="0" y1={H} x2={W*3+16} y2={H} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      {bar(pess, 0,       pess < 0 ? '#FF4D8A' : '#00F5E9')}
      {bar(base, W+8,     base < 0 ? '#FF4D8A' : '#00F5E9')}
      {bar(opt,  W*2+16,  opt  < 0 ? '#FF4D8A' : '#B8FF3E')}
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
      {[
        { x: 20,  h: 100, color: '#00F5E9', label: 'Гипотезы' },
        { x: 115, h: 120, color: '#B8FF3E', label: 'CustDev' },
        { x: 210, h: 85,  color: '#FFB830', label: 'MVP' },
      ].map(({ x, h, color, label }) => (
        <g key={x}>
          <rect x={x} y={155-h} width={70} height={h} rx="8"
            fill={`${color}10`} stroke={`${color}28`} strokeWidth="1"/>
          <circle cx={x+35} cy={155-h+20} r={11} fill={`${color}22`} stroke={`${color}60`} strokeWidth="1"/>
          <path d={`M${x+29} ${155-h+20}L${x+33} ${155-h+24}L${x+41} ${155-h+16}`}
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <text x={x+35} y={148} textAnchor="middle" fontSize="10" fill={color}
            fontFamily="Space Grotesk, sans-serif" fontWeight="700">{label}</text>
        </g>
      ))}
      <path d="M90 100 Q150 80 210 105" stroke="rgba(0,245,233,0.2)" strokeWidth="1" strokeDasharray="4 3" fill="none"/>
    </svg>
  )
}

// ── Roadmap illustration ──────────────────────────────────
export function RoadmapIllustration() {
  return (
    <svg viewBox="0 0 300 170" fill="none" style={{ width: '100%', maxWidth: 300 }}>
      <line x1="30" y1="16" x2="30" y2="155" stroke="rgba(0,245,233,0.18)" strokeWidth="1.5" strokeDasharray="4 3"/>
      {[
        { y: 28,  color: '#00F5E9', phase: 'Фаза 1',  title: 'Фундамент',      weeks: '1–4' },
        { y: 82,  color: '#B8FF3E', phase: 'Фаза 2',  title: 'Первые продажи', weeks: '5–8' },
        { y: 136, color: '#FFB830', phase: 'Фаза 3',  title: 'Оптимизация',    weeks: '9–12' },
      ].map(({ y, color, phase, title, weeks }) => (
        <g key={y}>
          <circle cx="30" cy={y} r="8" fill={`${color}18`} stroke={`${color}55`} strokeWidth="1.5"/>
          <circle cx="30" cy={y} r="4" fill={color}/>
          <rect x="48" y={y-18} width="234" height="36" rx="8"
            fill={`${color}06`} stroke={`${color}18`} strokeWidth="1"/>
          <text x="60" y={y-4} fontSize="9" fill={color}
            fontFamily="Space Grotesk, sans-serif" fontWeight="700" letterSpacing="0.08em">
            {phase} · НЕД {weeks}
          </text>
          <text x="60" y={y+11} fontSize="12" fill="rgba(240,246,255,0.85)"
            fontFamily="Space Grotesk, sans-serif" fontWeight="600">{title}</text>
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
