import type { IdeaCard } from '../types'
import { IdeaGlyph, ScoreRing, ArrowRight } from './Icons'
import { NexusLogo } from './Icons'

interface IdeasProps {
  ideas: IdeaCard[]
  onSelect: (idea: IdeaCard) => void
}

function diffBadge(d?: string) {
  if (d === 'easy')   return <span className="badge badge-emerald">Простой старт</span>
  if (d === 'hard')   return <span className="badge badge-rose">Сложный</span>
  return <span className="badge badge-neutral">Средний</span>
}

function trendBadge(t?: string) {
  if (t === 'growing')   return <span className="badge badge-emerald">↑ Растёт</span>
  if (t === 'declining') return <span className="badge badge-rose">↓ Падает</span>
  return <span className="badge badge-neutral">→ Стабильно</span>
}

function VerdictDot({ v }: { v: string }) {
  const bg = v === 'pass' ? 'var(--emerald)' : v === 'warn' ? 'var(--amber)' : 'var(--rose)'
  return <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: bg }} />
}

export function IdeasList({ ideas, onSelect }: IdeasProps) {
  return (
    <div className="screen">

      {/* Header */}
      <div className="top-bar">
        <div>
          <div className="t-label" style={{ marginBottom: 4 }}>Nexus · Результат</div>
          <div className="t-title">{ideas.length} идей</div>
          <div className="t-small" style={{ marginTop: 2 }}>прошли через 3 AI-фильтра</div>
        </div>
        <NexusLogo size={36} />
      </div>

      <div className="divider" style={{ marginBottom: 16 }} />

      <div className="scroll-area">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ideas.map((idea, i) => (
            <div
              key={idea.id}
              className="card"
              onClick={() => onSelect(idea)}
              style={{ animationDelay: `${i * 0.06}s`, animation: 'fadeUp 0.4s var(--ease) both' }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>

                {/* Glyph icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: 'var(--indigo-light)', color: 'var(--indigo)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <IdeaGlyph index={i} size={20} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 600, lineHeight: 1.3,
                    color: 'var(--text)', marginBottom: 3,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {idea.title}
                  </div>
                  {idea.tagline && (
                    <div className="t-small" style={{ color: 'var(--text-3)' }}>{idea.tagline}</div>
                  )}
                </div>

                {/* Score ring */}
                <ScoreRing score={idea.total_score || 0} size={48} />
              </div>

              {/* Description */}
              <p className="t-body" style={{ marginBottom: 12, fontSize: 13 }}>
                {(idea.description || '').slice(0, 115)}{(idea.description || '').length > 115 ? '…' : ''}
              </p>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Verdict dots */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <VerdictDot v={idea.financial_verdict || 'warn'} />
                  <VerdictDot v={idea.market_verdict    || 'warn'} />
                  <VerdictDot v={idea.ops_verdict       || 'warn'} />
                  <span className="t-small" style={{ marginLeft: 2 }}>фин · рынок · опс</span>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {diffBadge(idea.difficulty)}
                  {trendBadge(idea.trend)}
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
