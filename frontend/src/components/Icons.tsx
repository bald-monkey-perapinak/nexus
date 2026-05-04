// ── Nexus Logo ────────────────────────────────────────
export function NexusLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#4F46E5"/>
      <circle cx="20" cy="11" r="5" fill="white"/>
      <circle cx="11" cy="28" r="5" fill="white"/>
      <circle cx="29" cy="28" r="5" fill="white"/>
      <rect x="17.5" y="11" width="5" height="17" fill="white"/>
      <rect x="11" y="25.5" width="18" height="5" fill="white"/>
    </svg>
  )
}

// ── Splash hero illustration ──────────────────────────
export function HeroIllustration() {
  return (
    <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 320 }}>
      {/* Background circles */}
      <circle cx="160" cy="110" r="90" fill="#EEF2FF" />
      <circle cx="160" cy="110" r="65" fill="#E0E7FF" />

      {/* Central node */}
      <circle cx="160" cy="110" r="28" fill="#4F46E5" />
      <circle cx="160" cy="110" r="20" fill="white" opacity="0.2"/>
      <path d="M152 110L157 115L168 104" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Satellite nodes */}
      <circle cx="72"  cy="80"  r="18" fill="white" stroke="#C7D2FE" strokeWidth="1.5"/>
      <circle cx="248" cy="80"  r="18" fill="white" stroke="#C7D2FE" strokeWidth="1.5"/>
      <circle cx="72"  cy="145" r="18" fill="white" stroke="#C7D2FE" strokeWidth="1.5"/>
      <circle cx="248" cy="145" r="18" fill="white" stroke="#C7D2FE" strokeWidth="1.5"/>
      <circle cx="160" cy="38"  r="15" fill="white" stroke="#C7D2FE" strokeWidth="1.5"/>
      <circle cx="160" cy="185" r="15" fill="white" stroke="#C7D2FE" strokeWidth="1.5"/>

      {/* Connecting lines */}
      <line x1="132" y1="95"  x2="87"  y2="88"  stroke="#A5B4FC" strokeWidth="1.5" strokeDasharray="4 3"/>
      <line x1="188" y1="95"  x2="233" y2="88"  stroke="#A5B4FC" strokeWidth="1.5" strokeDasharray="4 3"/>
      <line x1="132" y1="122" x2="87"  y2="138" stroke="#A5B4FC" strokeWidth="1.5" strokeDasharray="4 3"/>
      <line x1="188" y1="122" x2="233" y2="138" stroke="#A5B4FC" strokeWidth="1.5" strokeDasharray="4 3"/>
      <line x1="160" y1="82"  x2="160" y2="53"  stroke="#A5B4FC" strokeWidth="1.5" strokeDasharray="4 3"/>
      <line x1="160" y1="138" x2="160" y2="170" stroke="#A5B4FC" strokeWidth="1.5" strokeDasharray="4 3"/>

      {/* Icons in satellite nodes */}
      {/* Money */}
      <text x="72"  y="85"  textAnchor="middle" fontSize="14">💰</text>
      {/* Chart */}
      <text x="248" y="85"  textAnchor="middle" fontSize="14">📊</text>
      {/* Idea */}
      <text x="72"  y="150" textAnchor="middle" fontSize="14">💡</text>
      {/* Target */}
      <text x="248" y="150" textAnchor="middle" fontSize="14">🎯</text>
      {/* Rocket */}
      <text x="160" y="43"  textAnchor="middle" fontSize="12">🚀</text>
      {/* Map */}
      <text x="160" y="190" textAnchor="middle" fontSize="12">🗺️</text>

      {/* Floating dots */}
      <circle cx="110" cy="55"  r="4" fill="#6366F1" opacity="0.5"/>
      <circle cx="215" cy="55"  r="3" fill="#818CF8" opacity="0.4"/>
      <circle cx="40"  cy="110" r="3" fill="#6366F1" opacity="0.3"/>
      <circle cx="280" cy="110" r="4" fill="#818CF8" opacity="0.4"/>
      <circle cx="110" cy="168" r="3" fill="#6366F1" opacity="0.4"/>
      <circle cx="215" cy="168" r="4" fill="#818CF8" opacity="0.3"/>
    </svg>
  )
}

// ── Generating animation illustration ─────────────────
export function GeneratingIllustration() {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" width="120" height="120">
      <circle cx="80" cy="80" r="70" fill="#EEF2FF"/>
      <circle cx="80" cy="80" r="50" fill="#E0E7FF"/>
      <circle cx="80" cy="80" r="30" fill="#C7D2FE"/>
      {/* Spinning ring */}
      <circle cx="80" cy="80" r="68" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray="60 340" style={{ transformOrigin: '80px 80px', animation: 'spin 1.5s linear infinite' }}/>
      {/* Center */}
      <circle cx="80" cy="80" r="16" fill="#4F46E5"/>
      <path d="M74 80L78 84L86 76" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ opacity: 0, animation: 'fadeIn 0.5s 0.5s forwards' }}/>
    </svg>
  )
}

// ── Idea card glyph ───────────────────────────────────
const GLYPHS = [
  // Lightning
  (size: number) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="currentColor" opacity="0.9"/>
    </svg>
  ),
  // Target
  (size: number) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>
  ),
  // Trending up
  (size: number) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 7H21V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // Layers
  (size: number) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  // Hexagon
  (size: number) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L20.5 7V17L12 22L3.5 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    </svg>
  ),
  // Star
  (size: number) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L14.9 9.3H22.5L16.3 13.8L18.6 21.2L12 16.8L5.4 21.2L7.7 13.8L1.5 9.3H9.1L12 2Z"
        stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    </svg>
  ),
]

export function IdeaGlyph({ index, size = 20 }: { index: number; size?: number }) {
  const G = GLYPHS[index % GLYPHS.length]
  return <G size={size} />
}

// ── Arrow icons ───────────────────────────────────────
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

// ── Score ring SVG ────────────────────────────────────
export function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 80 ? '#059669' : score >= 60 ? '#4F46E5' : '#D97706'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} stroke="#E4E7EC" strokeWidth="5" fill="none"/>
      <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="5" fill="none"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 0.8s var(--ease)' }}
      />
      <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize="15" fontWeight="700" fontFamily="JetBrains Mono, monospace" fill={color}>
        {score}
      </text>
    </svg>
  )
}

// ── Finance chart mini ─────────────────────────────────
export function MiniBarChart({ pess, base, opt }: { pess: number; base: number; opt: number }) {
  const max = Math.max(Math.abs(pess), Math.abs(base), Math.abs(opt), 1)
  const h = 48
  const bw = 28

  function bar(val: number, x: number, color: string, negColor: string) {
    const pos = val >= 0
    const height = (Math.abs(val) / max) * h
    const fill = pos ? color : negColor
    const y = pos ? h - height : h
    return (
      <g key={x}>
        <rect x={x} y={y} width={bw} height={height} rx="3" fill={fill} opacity="0.85"/>
      </g>
    )
  }

  return (
    <svg viewBox={`0 0 ${bw*3+16} ${h+4}`} style={{ overflow: 'visible' }}>
      <line x1="0" y1={h} x2={bw*3+16} y2={h} stroke="#E4E7EC" strokeWidth="1"/>
      {bar(pess, 0,         '#4F46E5', '#E11D48')}
      {bar(base, bw + 8,   '#4F46E5', '#E11D48')}
      {bar(opt,  bw*2 + 16, '#059669', '#E11D48')}
    </svg>
  )
}

// ── Validation illustration ────────────────────────────
export function ValidationIllustration() {
  return (
    <svg viewBox="0 0 280 160" fill="none" style={{ width: '100%', maxWidth: 280 }}>
      <rect x="20"  y="30"  width="70" height="90" rx="10" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1.5"/>
      <rect x="105" y="20"  width="70" height="110" rx="10" fill="#E0E7FF" stroke="#A5B4FC" strokeWidth="1.5"/>
      <rect x="190" y="40"  width="70" height="80" rx="10" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1.5"/>
      {/* Check marks */}
      <circle cx="55" cy="110" r="12" fill="#059669"/>
      <path d="M50 110L53 113L60 106" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="140" cy="115" r="12" fill="#4F46E5"/>
      <path d="M135 115L138 118L145 111" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="225" cy="105" r="12" fill="#D97706"/>
      <path d="M225 100V107M225 110V111" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      {/* Labels */}
      <text x="55"  y="55" textAnchor="middle" fontSize="11" fill="#6B7280" fontFamily="Inter, sans-serif">CustDev</text>
      <text x="140" y="45" textAnchor="middle" fontSize="11" fill="#6B7280" fontFamily="Inter, sans-serif">Гипотезы</text>
      <text x="225" y="65" textAnchor="middle" fontSize="11" fill="#6B7280" fontFamily="Inter, sans-serif">MVP</text>
    </svg>
  )
}
