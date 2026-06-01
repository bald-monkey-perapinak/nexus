import type { IdeaCard } from '../types'
import { IdeaGlyph, ScoreRing, ArrowRight, ChevronLeft } from './Icons'

interface Props {
  idea: IdeaCard; onBack: () => void
  onBuildModel: () => void; onValidate: () => void; onRoadmap: () => void; onAnalytics: () => void
}

const FLAGS: Record<string, [string, string]> = {
  capital_tight:        ['💸', 'Капитал на пределе'],
  capital_insufficient: ['❌', 'Недостаточно капитала'],
  high_competition:     ['⚔️', 'Высокая конкуренция'],
  license_required:     ['📋', 'Требуется лицензия'],
  license_medical:      ['🏥', 'Мед. лицензия'],
  license_education:    ['🎓', 'Образ. лицензия'],
  license_alcohol:      ['🍷', 'Лицензия на алкоголь'],
  market_saturated:     ['📉', 'Насыщен рынок'],
  market_declining:     ['📉', 'Рынок падает'],
  payback_too_long:     ['⏳', 'Долгая окупаемость'],
  team_insufficient:    ['👥', 'Нехватка команды'],
  experience_gap:       ['📚', 'Нет нужного опыта'],
  seasonal_cashflow:    ['🌊', 'Сезонный поток'],
  high_fixed_costs:     ['🏗️', 'Высокие фикс. расходы'],
}

function VerdictCard({ label, verdict }: { label: string; verdict: string }) {
  const cfg = {
    pass: { icon: '✓', color: 'var(--lime)',  bg: 'var(--lime-dim)',  border: 'rgba(170,255,62,0.2)' },
    warn: { icon: '!', color: 'var(--amber)', bg: 'var(--amber-dim)', border: 'rgba(255,184,0,0.2)' },
    fail: { icon: '✕', color: 'var(--rose)',  bg: 'var(--rose-dim)',  border: 'rgba(255,77,106,0.2)' },
  }[verdict] || { icon: '?', color: 'var(--t3)', bg: 'var(--bg-card)', border: 'var(--b2)' }
  return (
    <div className="verdict-pill" style={{ background: cfg.bg, borderColor: cfg.border }}>
      <div style={{ fontSize: 15, marginBottom: 4, color: cfg.color, fontWeight: 700 }}>{cfg.icon}</div>
      <div className="t-label" style={{ color: cfg.color }}>{label}</div>
    </div>
  )
}

function Block({ title, accent, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
        <div className="t-label" style={{ color: accent || 'var(--t3)' }}>{title}</div>
        <div style={{ flex: 1, height: 1, background: 'var(--b1)' }} />
      </div>
      {children}
    </div>
  )
}

export function IdeaDetail({ idea, onBack, onBuildModel, onValidate, onRoadmap, onAnalytics }: Props) {
  const flags = (idea.all_flags || []).map(f => [f, FLAGS[f] || ['⚠️', f]] as const)

  return (
    <div className="screen">
      <button className="btn btn-ghost" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <ChevronLeft size={15} /><span>Все идеи</span>
      </button>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, rgba(170,255,62,0.06) 0%, var(--bg-card) 60%)', border: '1px solid rgba(170,255,62,0.15)', borderRadius: 'var(--r-lg)', padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 50, height: 50, borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IdeaGlyph index={0} size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-card-title" style={{ fontSize: 18, marginBottom: 4 }}>{idea.title}</div>
            {idea.tagline && <div className="t-small">{idea.tagline}</div>}
          </div>
          <ScoreRing score={idea.total_score || 0} size={54} />
        </div>
      </div>

      {/* Verdicts */}
      <div className="verdict-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <VerdictCard label="Финансы"  verdict={idea.financial_verdict || 'warn'} />
        <VerdictCard label="Рынок"    verdict={idea.market_verdict    || 'warn'} />
        <VerdictCard label="Операции" verdict={idea.ops_verdict       || 'warn'} />
        <VerdictCard label="Локация"  verdict={idea.location_verdict  || 'pass'} />
      </div>

      <div className="divider divider-lime" />

      <div className="scroll-area">
        <Block title="Описание бизнеса">
          <div className="info-block"><p className="t-body">{idea.description}</p></div>
        </Block>

        <Block title="Почему вам подходит" accent="var(--lime)">
          <div className="info-block info-block-lime">
            <p className="t-body" style={{ color: 'var(--t1)' }}>{idea.why_for_you || idea.relevance_explanation}</p>
          </div>
        </Block>

        {idea.unique_angle && (
          <Block title="Как выделиться" accent="var(--teal)">
            <div className="info-block" style={{ borderLeft: '2px solid var(--teal)', borderColor: 'rgba(0,229,204,0.3)' }}>
              <p className="t-body">{idea.unique_angle}</p>
            </div>
          </Block>
        )}

        <Block title="Главный риск" accent="var(--rose)">
          <div className="info-block info-block-rose">
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
              <p className="t-body" style={{ color: 'var(--rose)' }}>{idea.main_risk}</p>
            </div>
          </div>
        </Block>

        <Block title="Ключ к успеху" accent="var(--amber)">
          <div className="info-block info-block-amber">
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>🔑</span>
              <p className="t-body" style={{ color: 'var(--amber)' }}>{idea.success_factor}</p>
            </div>
          </div>
        </Block>

        {(idea.realism_warnings || []).length > 0 && (
          <Block title="Предупреждения AI-аналитика" accent="var(--amber)">
            {idea.realism_warnings!.map((w, i) => (
              <div key={i} className="warn-banner" style={{ marginBottom: 7 }}>
                <span>🤖</span><span>{w}</span>
              </div>
            ))}
          </Block>
        )}

        {flags.length > 0 && (
          <Block title={`Флаги риска · ${flags.length}`} accent="var(--amber)">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {flags.map(([f, [emoji, label]]) => (
                <span key={f} className="badge badge-amber">{emoji} {label}</span>
              ))}
            </div>
          </Block>
        )}

        {(idea.market_analogues || []).length > 0 && (
          <Block title="Примеры на рынке">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {idea.market_analogues.map(a => (
                <span key={a} className="badge badge-neutral">🏢 {a}</span>
              ))}
            </div>
          </Block>
        )}
        <div style={{ height: 100 }} />
      </div>

      <div className="sticky-footer">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              console.log('MARKET BUTTON CLICKED')
              console.log('onAnalytics:', onAnalytics)
          
              try {
                onAnalytics()
              } catch (e) {
                console.error('onAnalytics crash:', e)
              }
            }}
            style={{ flex: 1 }}
          >
            🔍 Рынок
          </button>
          <button className="btn btn-outline btn-sm" onClick={onValidate}  style={{ flex: 1 }}>✅ Валидация</button>
          <button className="btn btn-outline btn-sm" onClick={onRoadmap}   style={{ flex: 1 }}>🗺️ Роадмап</button>
        </div>
        <button className="btn btn-primary" onClick={onBuildModel}>
          📊 Финансовая модель <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}
