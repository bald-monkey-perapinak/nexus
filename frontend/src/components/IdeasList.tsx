import type { IdeaCard } from '../types'
import { IdeaGlyph, ScoreRing, ArrowRight, NexusLogo } from './Icons'

interface Props { ideas: IdeaCard[]; onSelect: (idea: IdeaCard) => void }

function VerdictRow({ fin, mkt, ops }: { fin: string; mkt: string; ops: string }) {
  function dot(v: string) {
    const c = v === 'pass' ? 'var(--lime)' : v === 'warn' ? 'var(--amber)' : 'var(--rose)'
    return <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}60` }} />
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {dot(fin)}{dot(mkt)}{dot(ops)}
      <span className="t-small" style={{ marginLeft: 3, fontSize: 10 }}>фин · рынок · опс</span>
    </div>
  )
}

function DiffBadge({ d }: { d?: string }) {
  if (d === 'easy')  return <span className="badge badge-lime">Лёгкий</span>
  if (d === 'hard')  return <span className="badge badge-rose">Сложный</span>
  return <span className="badge badge-neutral">Средний</span>
}

function TrendBadge({ t }: { t?: string }) {
  if (t === 'growing')   return <span className="badge badge-lime">↑ Растёт</span>
  if (t === 'declining') return <span className="badge badge-rose">↓ Падает</span>
  return <span className="badge badge-neutral">→ Стабильно</span>
}

export function IdeasList({ ideas, onSelect }: Props) {
  return (
    <div className="screen">
      <div className="top-bar">
        <div>
          <div className="t-label" style={{ marginBottom: 4, color: 'var(--lime)' }}>Результат анализа</div>
          <div className="t-title">{ideas.length} идей</div>
          <div className="t-small" style={{ marginTop: 2 }}>прошли через 3 AI‑фильтра</div>
        </div>
        <NexusLogo size={34} />
      </div>

      <div className="divider divider-lime" style={{ marginBottom: 16 }} />

      <div className="scroll-area">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ideas.map((idea, i) => (
            <div key={idea.id} className="card" onClick={() => onSelect(idea)}
              style={{ animationDelay: `${i * 0.06}s`, animation: 'screenIn 0.4s var(--ease) both' }}>

              {/* Top row */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                {/* Glyph */}
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <IdeaGlyph index={i} size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-card-title" style={{ marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {idea.title}
                  </div>
                  {idea.tagline && <div className="t-small">{idea.tagline}</div>}
                </div>
                <ScoreRing score={idea.total_score || 0} size={46} />
              </div>

              {/* Description */}
              <p className="t-body" style={{ fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
                {(idea.description || '').slice(0, 110)}{(idea.description || '').length > 110 ? '…' : ''}
              </p>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <VerdictRow fin={idea.financial_verdict || 'warn'} mkt={idea.market_verdict || 'warn'} ops={idea.ops_verdict || 'warn'} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <DiffBadge d={idea.difficulty} />
                  <TrendBadge t={idea.trend} />
                  <ArrowRight size={13} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
