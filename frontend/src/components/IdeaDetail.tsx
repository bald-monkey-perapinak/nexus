import type { IdeaCard } from '../types'
import { IdeaGlyph, ScoreRing, ArrowRight, ChevronLeft } from './Icons'

interface IdeaDetailProps {
  idea: IdeaCard
  onBack: () => void
  onBuildModel: () => void
  onValidate: () => void
  onRoadmap: () => void
}

const FLAG_META: Record<string, [string, string]> = {
  capital_tight:        ['💸', 'Капитал на пределе'],
  capital_insufficient: ['❌', 'Недостаточно капитала'],
  high_competition:     ['⚔️', 'Высокая конкуренция'],
  license_required:     ['📋', 'Требуется лицензия'],
  license_medical:      ['🏥', 'Мед. лицензия'],
  license_education:    ['🎓', 'Образ. лицензия'],
  license_alcohol:      ['🍷', 'Лицензия на алкоголь'],
  market_saturated:     ['📉', 'Насыщенный рынок'],
  market_declining:     ['📉', 'Падающий рынок'],
  payback_too_long:     ['⏳', 'Долгая окупаемость'],
  team_insufficient:    ['👥', 'Нехватка команды'],
  experience_gap:       ['📚', 'Нет нужного опыта'],
  seasonal_cashflow:    ['🌊', 'Сезонный поток'],
  high_fixed_costs:     ['🏗️', 'Высокие фикс. расходы'],
}

function VerdictCard({ label, verdict }: { label: string; verdict: string }) {
  const cfg = {
    pass: { icon: '✓', bg: 'var(--emerald-bg)', color: 'var(--emerald)', border: 'rgba(5,150,105,0.2)' },
    warn: { icon: '!', bg: 'var(--amber-bg)',   color: 'var(--amber)',   border: 'rgba(217,119,6,0.2)'  },
    fail: { icon: '✕', bg: 'var(--rose-bg)',    color: 'var(--rose)',    border: 'rgba(225,29,72,0.2)'  },
  }[verdict] || { icon: '?', bg: 'var(--bg-2)', color: 'var(--text-3)', border: 'var(--border)' }

  return (
    <div className="verdict-pill" style={{ background: cfg.bg, borderColor: cfg.border }}>
      <div style={{ fontSize: 16, marginBottom: 4 }}>{cfg.icon}</div>
      <div className="t-label" style={{ color: cfg.color }}>{label}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div className="t-label">{title}</div>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>
      {children}
    </div>
  )
}

export function IdeaDetail({ idea, onBack, onBuildModel, onValidate }: IdeaDetailProps) {
  const flags = (idea.all_flags || []).map(f => [f, FLAG_META[f] || ['⚠️', f]] as const)

  return (
    <div className="screen">

      <button className="btn btn-ghost" onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <ChevronLeft size={16} />
        <span>Все идеи</span>
      </button>

      {/* Hero card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--indigo-light), var(--bg))',
        border: '1.5px solid var(--indigo-mid)',
        borderRadius: 'var(--r-lg)',
        padding: '20px',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: 'var(--indigo)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <IdeaGlyph index={0} size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, marginBottom: 4 }}>
              {idea.title}
            </div>
            {idea.tagline && <div className="t-small">{idea.tagline}</div>}
          </div>
          <ScoreRing score={idea.total_score || 0} size={56} />
        </div>
      </div>

      {/* Verdict row */}
      <div className="verdict-row">
        <VerdictCard label="Финансы"  verdict={idea.financial_verdict || 'warn'} />
        <VerdictCard label="Рынок"    verdict={idea.market_verdict    || 'warn'} />
        <VerdictCard label="Операции" verdict={idea.ops_verdict       || 'warn'} />
      </div>

      <div className="divider" />

      <div className="scroll-area">

        <Section title="Суть бизнеса">
          <div className="info-block">
            <p className="t-body">{idea.description}</p>
          </div>
        </Section>

        <Section title="Почему вам подходит">
          <div className="info-block info-block-success">
            <p className="t-body">{idea.why_for_you || idea.relevance_explanation}</p>
          </div>
        </Section>

        {idea.unique_angle && (
          <Section title="Как выделиться">
            <div className="info-block" style={{ borderLeft: '3px solid var(--indigo)' }}>
              <p className="t-body">{idea.unique_angle}</p>
            </div>
          </Section>
        )}

        <Section title="Главный риск">
          <div className="info-block info-block-risk">
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <p className="t-body" style={{ color: 'var(--rose)' }}>{idea.main_risk}</p>
            </div>
          </div>
        </Section>

        <Section title="Ключ к успеху">
          <div className="info-block">
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🔑</span>
              <p className="t-body">{idea.success_factor}</p>
            </div>
          </div>
        </Section>

        {flags.length > 0 && (
          <Section title={`Флаги риска · ${flags.length}`}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {flags.map(([f, [emoji, label]]) => (
                <span key={f} className="badge badge-amber">
                  {emoji} {label}
                </span>
              ))}
            </div>
          </Section>
        )}

        {(idea.market_analogues || []).length > 0 && (
          <Section title="Примеры на рынке">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {idea.market_analogues.map(a => (
                <span key={a} className="badge badge-neutral">🏢 {a}</span>
              ))}
            </div>
          </Section>
        )}

        <div style={{ height: 100 }} />
      </div>

      {/* Sticky CTA */}
      <div className="sticky-footer">
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline btn-sm" onClick={onValidate}>
            ✅ Валидация
          </button>
          <button className="btn btn-primary" onClick={onBuildModel}>
            📊 Финмодель
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
