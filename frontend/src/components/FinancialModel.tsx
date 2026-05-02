import { useState, useEffect } from 'react'
import type { IdeaCard, FinancialModel } from '../types'
import { createFinancialModel } from '../api'

interface FinancialProps {
  idea: IdeaCard
  sessionId: string
  onBack: () => void
}

function fmt(n: number) {
  if (!n && n !== 0) return '—'
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} млн`
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1000)} тыс`
  return `${Math.round(n)}`
}

export function FinancialModelScreen({ idea, sessionId, onBack }: FinancialProps) {
  const [model, setModel] = useState<FinancialModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adj, setAdj] = useState<Record<string, number>>({})
  const [activeScenario, setActiveScenario] = useState<'pessimistic' | 'base' | 'optimistic'>('base')

  async function load(adjustments?: Record<string, number>) {
    setLoading(true)
    try {
      const result = await createFinancialModel(sessionId, idea.id, adjustments) as FinancialModel
      setModel(result)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handleSliderChange(key: string, value: number) {
    const newAdj = { ...adj, [key]: value }
    setAdj(newAdj)
  }

  function recalculate() {
    load(adj)
  }

  if (loading) {
    return (
      <div className="screen">
        <div className="loader-wrap">
          <div className="loader-text">Строим финансовую модель...</div>
        </div>
      </div>
    )
  }

  if (error || !model) {
    return (
      <div className="screen">
        <button className="btn btn-ghost" onClick={onBack}>← назад</button>
        <div style={{ marginTop: 24, color: 'var(--red)' }}>{error || 'Ошибка'}</div>
      </div>
    )
  }

  const a = model.assumptions
  const s = model.scenarios[activeScenario]
  const ue = model.unit_economics

  return (
    <div className="screen">
      <button className="btn btn-ghost" onClick={onBack} style={{ textAlign: 'left', padding: '0 0 16px' }}>
        ← назад
      </button>

      <div className="display-sm" style={{ marginBottom: 4 }}>{idea.title}</div>
      <div className="label" style={{ marginBottom: 16 }}>Финансовая модель</div>

      <div className="rule" />

      <div className="scroll-area">

        {/* Scenario selector */}
        <div style={{ marginTop: 16 }}>
          <div className="label" style={{ marginBottom: 8 }}>Сценарий</div>
          <div className="scenario-grid">
            {(['pessimistic', 'base', 'optimistic'] as const).map(sc => (
              <div
                key={sc}
                className={`scenario-box ${activeScenario === sc ? 'active' : ''}`}
                onClick={() => setActiveScenario(sc)}
                style={{ cursor: 'pointer' }}
              >
                <div className="label">{sc === 'pessimistic' ? 'Пессим.' : sc === 'base' ? 'Базовый' : 'Оптимист.'}</div>
                <span className="scenario-value">{fmt(model.scenarios[sc].monthly_profit)}</span>
                <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2, fontFamily: 'var(--font-mono)' }}>прибыль/мес</div>
              </div>
            ))}
          </div>
        </div>

        {/* Key metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--ink)', border: '1px solid var(--ink)', marginBottom: 16 }}>
          {[
            { label: 'Выручка/мес', value: fmt(s.monthly_revenue) },
            { label: 'Прибыль/мес', value: fmt(s.monthly_profit) },
            { label: 'Точка безубыт.', value: `${s.breakeven_clients} кл.` },
            { label: 'Окупаемость', value: s.payback_months ? `${s.payback_months} мес` : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--white)', padding: '14px 12px' }}>
              <div className="label">{label}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginTop: 4 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Sliders */}
        <div className="label" style={{ marginBottom: 12 }}>Настройте параметры</div>

        <SliderRow
          label="Средний чек"
          value={adj.avg_check ?? a.avg_check_rub}
          min={a.avg_check_rub * 0.3}
          max={a.avg_check_rub * 3}
          step={500}
          format={v => fmt(v) + ' ₽'}
          onChange={v => handleSliderChange('avg_check', v)}
        />

        <SliderRow
          label="Клиентов в месяц"
          value={adj.monthly_clients ?? a.monthly_clients_base}
          min={1}
          max={a.monthly_clients_mature * 2}
          step={1}
          format={v => `${Math.round(v)} чел.`}
          onChange={v => handleSliderChange('monthly_clients', v)}
        />

        <SliderRow
          label="Постоянные расходы"
          value={adj.fixed_costs ?? a.fixed_costs_monthly.total}
          min={a.fixed_costs_monthly.total * 0.5}
          max={a.fixed_costs_monthly.total * 2}
          step={5000}
          format={v => fmt(v) + ' ₽'}
          onChange={v => handleSliderChange('fixed_costs', v)}
        />

        <button className="btn" onClick={recalculate} disabled={loading}>
          Пересчитать →
        </button>

        {/* Unit economics */}
        {ue && (
          <div style={{ marginTop: 24 }}>
            <div className="label" style={{ marginBottom: 12 }}>Юнит-экономика</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: 'var(--ink)', border: '1px solid var(--ink)' }}>
              {[
                { label: 'CAC', value: fmt(ue.cac_rub) + ' ₽' },
                { label: 'LTV', value: fmt(ue.ltv_rub) + ' ₽' },
                { label: 'LTV/CAC', value: ue.ltv_cac_ratio?.toFixed(1) || '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--white)', padding: '12px 8px', textAlign: 'center' }}>
                  <div className="label">{label}</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>
            {ue.ltv_cac_verdict && (
              <div className="label" style={{ marginTop: 8, opacity: 0.6 }}>{ue.ltv_cac_verdict}</div>
            )}
          </div>
        )}

        {/* Warnings */}
        {model.validation_warnings.length > 0 && (
          <div style={{ marginTop: 16, padding: '12px', border: '1px solid var(--gold)' }}>
            <div className="label" style={{ color: 'var(--gold)', marginBottom: 8 }}>Предупреждения</div>
            {model.validation_warnings.map(w => (
              <div key={w} style={{ fontSize: 11, color: 'var(--gold)', marginBottom: 4 }}>— {w}</div>
            ))}
          </div>
        )}

        {a.assumptions_notes && (
          <div style={{ marginTop: 16 }}>
            <div className="label" style={{ marginBottom: 8 }}>Допущения модели</div>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.7 }}>{a.assumptions_notes}</p>
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}

function SliderRow({
  label, value, min, max, step, format, onChange
}: {
  label: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="label">{label}</div>
        <div className="label">{format(value)}</div>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  )
}
