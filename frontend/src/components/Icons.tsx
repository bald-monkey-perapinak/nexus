// Geometric logo inspired by the Bauhaus grid image
export function NexusLogo({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" className="geo-logo">
      <circle cx="22" cy="12" r="8" fill="var(--ink)" />
      <circle cx="12" cy="28" r="7" fill="var(--ink)" />
      <circle cx="32" cy="28" r="7" fill="var(--ink)" />
      <rect x="18" y="12" width="8" height="24" fill="var(--ink)" />
      <rect x="5" y="24" width="34" height="8" fill="var(--ink)" />
    </svg>
  )
}

export function LoaderGeo() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="loader-geo">
      <circle cx="32" cy="16" r="10" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="6" fill="var(--ink)" opacity="0.3" />
      <rect x="28" y="16" width="8" height="36" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
      <rect x="10" y="28" width="44" height="8" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
      <circle cx="10" cy="32" r="8" fill="var(--ink)" />
      <circle cx="54" cy="32" r="8" fill="var(--ink)" />
      <circle cx="32" cy="16" r="8" fill="var(--ink)" />
      <circle cx="32" cy="56" r="6" fill="var(--ink)" />
    </svg>
  )
}

export function IdeaGlyph({ index }: { index: number }) {
  const glyphs = [
    // Cross/plus
    <path key="0" d="M12 5 L12 19 M5 12 L19 12" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="square" />,
    // Circle
    <circle key="1" cx="12" cy="12" r="7" stroke="var(--ink)" strokeWidth="2" fill="none" />,
    // Triangle
    <path key="2" d="M12 4 L20 18 L4 18 Z" stroke="var(--ink)" strokeWidth="1.5" fill="none" />,
    // Diamond
    <path key="3" d="M12 3 L21 12 L12 21 L3 12 Z" stroke="var(--ink)" strokeWidth="1.5" fill="none" />,
    // Square
    <rect key="4" x="4" y="4" width="16" height="16" stroke="var(--ink)" strokeWidth="1.5" fill="none" />,
    // Half circle
    <path key="5" d="M4 12 A8 8 0 0 1 20 12" stroke="var(--ink)" strokeWidth="2" fill="none" />,
  ]
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {glyphs[index % glyphs.length]}
    </svg>
  )
}
