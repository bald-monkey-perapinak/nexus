import type { IdeaCard } from '../types'
import { IdeaGlyph } from './Icons'

interface IdeaDetailProps {
  idea: IdeaCard
  onBack: () => void
  onBuildModel: () => void
}

const FLAG_LABELS: Record<string, string> = {
  capital_tight: 'Капитал на пределе',
  high_competition: 'Высокая конкуренция',
  license_required: 'Нужна лицензия',
  license_medical: 'Мед. лицензия',
  license_education: 'Образ. лицензия',
  license_alcohol: 'Лиц. на алкоголь',
  market_saturated: 'Насыщенный рынок',
  payback_too_long: 'Долгая окупаемость',
  team_insufficient: 'Нехватка команды',
  experience_gap: 'Нет нужного опыта',
  seasonal_cashflow: 'Сезонный поток',
  high_fixed_costs: 'Высокие фикс. расходы',
}

function VerdictDot({ v }: { v: string }) {
  const color = v === 'pass' ? 'var(--ink)' : v === 'warn' ? 'var(--gold)' : 'var(--red)'
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color }} />
}

export function IdeaDetail({ idea, onBack, onBuildModel }: IdeaDetailProps) {
  return (
    <div className="screen">
      <button className="btn btn-ghost" onClick={onBack} style={{ textAlign: 'left', padding: '0 0 16px' }}>
        ← назад
      </button>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
        <IdeaGlyph index={0} />
        <div className="display-sm">{idea.title}</div>
      </div>

      {idea.tagline && (
        <div className="label" style={{ marginBottom: 16 }}>{idea.tagline}</div>
      )}

      <div className="rule" />

      <div className="scroll-area">

        {/* Дискриминаторы */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--ink)', border: '1px solid var(--ink)', margin: '16px 0' }}>
          {[
            { label: 'Финансы', v: idea.financial_verdict },
            { label: 'Рынок', v: idea.market_verdict },
            { label: 'Операции', v: idea.ops_verdict },
          ].map(({ label, v }) => (
            <div key={label} style={{ background: 'var(--white)', padding: '12px 8px', textAlign: 'center' }}>
              <VerdictDot v={v} />
              <div className="label" style={{ marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <Section title="Суть">
          <p style={{ fontSize: 13, lineHeight: 1.7 }}>{idea.description}</p>
        </Section>

        <Section title="Почему вам подходит">
          <p style={{ fontSize: 13, lineHeight: 1.7 }}>
            {idea.why_for_you || idea.relevance_explanation}
          </p>
        </Section>

        <Section title="Как выделиться">
          <p style={{ fontSize: 13, lineHeight: 1.7 }}>
            {idea.unique_angle || '—'}
          </p>
        </Section>

        <Section title="Главный риск">
          <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--red)' }}>{idea.main_risk}</p>
        </Section>

        <Section title="Ключ к успеху">
          <p style={{ fontSize: 13, lineHeight: 1.7 }}>{idea.success_factor}</p>
        </Section>

        {idea.all_flags.length > 0 && (
          <Section title="Флаги риска">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {idea.all_flags.map(f => (
                <span key={f} className="tag tag-warn">
                  {FLAG_LABELS[f] || f}
                </span>
              ))}
            </div>
          </Section>
        )}

        {idea.market_analogues?.length > 0 && (
          <Section title="Аналоги">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {idea.market_analogues.map(a => (
                <span key={a} className="tag tag-ok">{a}</span>
              ))}
            </div>
          </Section>
        )}

        <div style={{ height: 80 }} />
      </div>

      <div style={{ paddingTop: 12 }}>
        <button className="btn btn-fill" onClick={onBuildModel}>
          Построить финансовую модель →
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ margin: '16px 0' }}>
      <div className="label" style={{ marginBottom: 8 }}>{title}</div>
      {children}
      <div className="rule" style={{ marginTop: 16 }} />
    </div>
  )
}
