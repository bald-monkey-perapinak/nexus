import { useState } from 'react'
import type { IdeaCard, Contradiction } from '../types'
import { IdeaGlyph, ScoreRing, ArrowRight, NexusLogoMark } from './Icons'

interface Props {
  ideas: IdeaCard[]
  contradictions: Contradiction[]
  onSelect: (idea: IdeaCard) => void
  onRegenerate: () => void
  onEditProfile: () => void
}

function VerdictRow({ fin, mkt, ops }: { fin: string; mkt: string; ops: string }) {
  function dot(v: string) {
    const c = v === 'pass' ? 'var(--cyan)' : v === 'warn' ? 'var(--amber)' : 'var(--rose)'
    return <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}` }} />
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {dot(fin)}{dot(mkt)}{dot(ops)}
      <span className="t-small" style={{ marginLeft: 3, fontSize: 10 }}>фин · рынок · опс</span>
    </div>
  )
}

function DiffBadge({ d }: { d?: string }) {
  if (d === 'easy')  return <span className="badge badge-cyan">Лёгкий</span>
  if (d === 'hard')  return <span className="badge badge-rose">Сложный</span>
  return <span className="badge badge-neutral">Средний</span>
}

function TrendBadge({ t }: { t?: string }) {
  if (t === 'growing')   return <span className="badge badge-lime">↑ Растёт</span>
  if (t === 'declining') return <span className="badge badge-rose">↓ Падает</span>
  return <span className="badge badge-neutral">→ Стабильно</span>
}

export function IdeasList({ ideas, contradictions, onSelect, onRegenerate, onEditProfile }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [showContradictions, setShowContradictions] = useState(true)

  const blockingCount = contradictions.filter(c => c.severity === 'blocking').length

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
          <div className="t-label" style={{ marginBottom: 5, color: 'var(--cyan)' }}>Результат анализа</div>
          <div className="t-title">{ideas.length} идей</div>
          <div className="t-small" style={{ marginTop: 2 }}>прошли через 3 AI‑фильтра</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          <NexusLogoMark size={34} />
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{
                background: 'var(--bg-card)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--b2)',
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
                <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'rgba(8,13,26,0.95)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid var(--b2)',
                  borderRadius: 'var(--r)', padding: 6, zIndex: 20,
                  minWidth: 190,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,245,233,0.08)',
                  animation: 'screenIn 0.15s var(--ease)',
                }}>
                  <button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      background: 'transparent', border: 'none', borderRadius: 7,
                      padding: '10px 12px', cursor: 'pointer', transition: 'background 0.13s',
                      fontFamily: 'var(--f)', fontSize: 13, fontWeight: 600, color: 'var(--cyan)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--cyan-dim)')}
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
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-glass)')}
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

      <div className="divider divider-cyan" style={{ marginBottom: 16 }} />

      {/* Contradictions block */}
      {contradictions.length > 0 && showContradictions && (
        <div style={{
          background: blockingCount > 0 ? 'var(--rose-dim)' : 'var(--amber-dim)',
          border: `1px solid ${blockingCount > 0 ? 'rgba(255,77,138,0.3)' : 'rgba(255,184,48,0.3)'}`,
          borderRadius: 'var(--r-lg)', padding: 14, marginBottom: 16,
          animation: 'screenIn 0.3s var(--ease)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 18 }}>{blockingCount > 0 ? '⚠️' : '💡'}</span>
              <div>
                <div style={{ fontFamily: 'var(--f)', fontSize: 13, fontWeight: 700, color: blockingCount > 0 ? 'var(--rose)' : 'var(--amber)' }}>
                  {blockingCount > 0 ? 'Обнаружены противоречия' : 'Замечания по профилю'}
                </div>
                <div className="t-small" style={{ marginTop: 2 }}>Идеи учитывают это, но могут быть ограничения</div>
              </div>
            </div>
            <button onClick={() => setShowContradictions(false)} style={{ background: 'none', border: 'none', color: 'var(--t4)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2 }}>×</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {contradictions.map((c, i) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.18)', borderRadius: 'var(--r-sm)', padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{c.severity === 'blocking' ? '🔴' : '🟡'}</span>
                <div>
                  <div style={{ fontFamily: 'var(--f)', fontSize: 11, fontWeight: 700, color: c.severity === 'blocking' ? 'var(--rose)' : 'var(--amber)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {c.severity === 'blocking' ? 'Нереалистично' : 'Предупреждение'} · {c.field_a} × {c.field_b}
                  </div>
                  <div className="t-small" style={{ color: 'var(--t2)', lineHeight: 1.55 }}>{c.description}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => { setShowContradictions(false); onEditProfile() }} style={{
            marginTop: 10, background: 'transparent',
            border: `1px solid ${blockingCount > 0 ? 'rgba(255,77,138,0.4)' : 'rgba(255,184,48,0.4)'}`,
            borderRadius: 'var(--r-sm)', padding: '7px 14px', width: '100%',
            fontFamily: 'var(--f)', fontSize: 12, fontWeight: 700,
            color: blockingCount > 0 ? 'var(--rose)' : 'var(--amber)', cursor: 'pointer',
          }}>
            ✏️ Скорректировать профиль
          </button>
        </div>
      )}

      <div className="scroll-area">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ideas.map((idea, i) => (
            <div key={idea.id} className="card" onClick={() => onSelect(idea)}
              style={{ animationDelay: `${i * 0.06}s`, animation: 'screenIn 0.4s var(--ease) both' }}>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: 'rgba(0,245,233,0.06)', border: '1px solid rgba(0,245,233,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--b2)',
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
              background: 'var(--cyan-dim)', border: '1px solid rgba(0,245,233,0.3)',
              borderRadius: 'var(--r-sm)', padding: '8px 14px',
              fontFamily: 'var(--f)', fontSize: 12, fontWeight: 700,
              color: 'var(--cyan)', cursor: 'pointer', flexShrink: 0,
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
