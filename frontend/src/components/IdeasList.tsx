import { useState } from 'react'
import type { IdeaCard } from '../types'
import { IdeaGlyph, ScoreRing, ArrowRight, NexusLogo } from './Icons'

interface Props {
  ideas: IdeaCard[]
  onSelect: (idea: IdeaCard) => void
  onRegenerate: () => void
  onEditProfile: () => void
}

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

export function IdeasList({ ideas, onSelect, onRegenerate, onEditProfile }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  async function handleRegenerate() {
    setMenuOpen(false)
    setRegenerating(true)
    try { await onRegenerate() }
    finally { setRegenerating(false) }
  }

  return (
    <div className="screen">
      <div className="top-bar">
        <div>
          <div className="t-label" style={{ marginBottom: 4, color: 'var(--lime)' }}>Результат анализа</div>
          <div className="t-title">{ideas.length} идей</div>
          <div className="t-small" style={{ marginTop: 2 }}>прошли через 3 AI‑фильтра</div>
        </div>

        {/* Header actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          <NexusLogo size={34} />
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--b2)',
                borderRadius: 'var(--r-sm)', padding: '6px 12px',
                fontFamily: 'var(--f)', fontSize: 11, fontWeight: 700,
                color: 'var(--t3)', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: 5, transition: 'all 0.15s',
              }}
            >
              ⋯ Действия
            </button>

            {menuOpen && (
              <>
                {/* Backdrop */}
                <div
                  onClick={() => setMenuOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                />
                {/* Dropdown */}
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'var(--bg-card)', border: '1px solid var(--b2)',
                  borderRadius: 'var(--r)', padding: 6, zIndex: 20,
                  minWidth: 190,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                  animation: 'screenIn 0.15s var(--ease)',
                }}>
                  <button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      background: 'transparent', border: 'none', borderRadius: 7,
                      padding: '10px 12px', cursor: 'pointer', transition: 'background 0.13s',
                      fontFamily: 'var(--f)', fontSize: 13, fontWeight: 600, color: 'var(--lime)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--lime-dim)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: 16 }}>🔄</span>
                    <div>
                      <div>{regenerating ? 'Генерируем…' : 'Новые идеи'}</div>
                      <div style={{ fontSize: 10, color: 'var(--t4)', fontWeight: 400, marginTop: 1 }}>С тем же профилем</div>
                    </div>
                  </button>

                  <div style={{ height: 1, background: 'var(--b1)', margin: '4px 6px' }} />

                  <button
                    onClick={() => { setMenuOpen(false); onEditProfile() }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      background: 'transparent', border: 'none', borderRadius: 7,
                      padding: '10px 12px', cursor: 'pointer', transition: 'background 0.13s',
                      fontFamily: 'var(--f)', fontSize: 13, fontWeight: 600, color: 'var(--t2)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: 16 }}>✏️</span>
                    <div>
                      <div>Изменить профиль</div>
                      <div style={{ fontSize: 10, color: 'var(--t4)', fontWeight: 400, marginTop: 1 }}>Скорректировать параметры</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="divider divider-lime" style={{ marginBottom: 16 }} />

      <div className="scroll-area">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ideas.map((idea, i) => (
            <div key={idea.id} className="card" onClick={() => onSelect(idea)}
              style={{ animationDelay: `${i * 0.06}s`, animation: 'screenIn 0.4s var(--ease) both' }}>

              {/* Top row */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
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

              <p className="t-body" style={{ fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
                {(idea.description || '').slice(0, 110)}{(idea.description || '').length > 110 ? '…' : ''}
              </p>

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

        {/* Bottom regenerate nudge */}
        <div style={{
          margin: '20px 0 8px', padding: '14px 16px',
          background: 'var(--bg-card)', border: '1px solid var(--b2)',
          borderRadius: 'var(--r-lg)', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--f)', fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 2 }}>
              Не нашли подходящую?
            </div>
            <div className="t-small">Сгенерируйте новый набор или скорректируйте профиль</div>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            style={{
              background: 'var(--lime-dim)', border: '1px solid rgba(170,255,62,0.3)',
              borderRadius: 'var(--r-sm)', padding: '8px 14px',
              fontFamily: 'var(--f)', fontSize: 12, fontWeight: 700,
              color: 'var(--lime)', cursor: 'pointer', flexShrink: 0,
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
          >
            {regenerating ? '⏳…' : '🔄 Новые'}
          </button>
        </div>
        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}
