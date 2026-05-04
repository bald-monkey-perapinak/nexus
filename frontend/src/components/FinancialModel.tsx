import { useState, useEffect } from 'react'
import type { IdeaCard, FinancialModel } from '../types'
import { createFinancialModel } from '../api'
import { ChevronLeft, MiniBarChart } from './Icons'

interface FinancialProps {
  idea: IdeaCard
  sessionId: string
  onBack: () => void
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  const sign = n < 0 ? '−' : ''
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)} млн`
  if (abs >= 1_000)     return `${sign}${(abs / 1000).toFixed(0)} тыс`
  return `${sign}${Math.round(abs)}`
}

function SliderField({ label, value, min, max, step, display, onChange }: {
  label: string; value: number; min: number; max: number
  step: number; display: string; onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div className="form-label">{label}</div>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 15, fontWeight: 700, color: 'var(--indigo)' }}>
          {display}
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <div className="t-small">{fmt(min)}</div>
        <div className="t-small">{fmt(max)}</div>
      </div>
    </div>
  )
}

export function FinancialModelScreen({ idea, sessionId, onBack }: FinancialProps) {
  const [model, setModel]             = useState<FinancialModel | null>(null)
  const [loading, setLoading]         = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const [error, setError]             = useState('')
  const [adj, setAdj]                 = useState<Record<string, number>>({})
  const [scenario, setScenario]       = useState<'pessimistic' | 'base' | 'optimistic'>('base')

  async function load(adjustments: Record<string, number> = {}) {
    try {
      const r = await createFinancialModel(sessionId, idea.id, adjustments) as FinancialModel
      setModel(r)
      if (!Object.keys(adj).length) {
        setAdj({
          avg_check:       r.assumptions.avg_check_rub,
          monthly_clients: r.assumptions.monthly_clients_base,
          fixed_costs:     r.assumptions.fixed_costs_monthly.total,
        })
      }
    } catch (e: unknown) { setError((e as Error).message) }
  }

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  async function recalculate() {
    setRecalculating(true)
    await load(adj)
    setRecalculating(false)
  }

  if (loading) return (
    <div className="screen">
      <div className="loader-wrap">
        <div className="loader-spinner" />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Строим финансовую модель</div>
          <div className="t-small">Генерируем реалистичные допущения для ниши…</div>
        </div>
      </div>
    </div>
  )

  if (error || !model) return (
    <div className="screen">
      <button className="btn btn-ghost" onClick={onBack}><ChevronLeft size={16}/> Назад</button>
      <div style={{ marginTop: 24, color: 'var(--rose)', fontSize: 14 }}>{error || 'Ошибка'}</div>
    </div>
  )

  const a  = model.assumptions
  const sc = model.scenarios[scenario]
  const ue = model.unit_economics || {}

  const scenariosArr = [
    { key: 'pessimistic' as const, label: 'Пессимист.', emoji: '😐' },
    { key: 'base'        as const, label: 'Базовый',    emoji: '📊' },
    { key: 'optimistic'  as const, label: 'Оптимист.',  emoji: '🚀' },
  ]

  return (
    <div className="screen">

      <button className="btn btn-ghost" onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <ChevronLeft size={16} /><span>Идея</span>
      </button>

      <div className="t-label" style={{ marginBottom: 4 }}>{idea.title}</div>
      <div className="t-title" style={{ marginBottom: 20 }}>Финансовая модель</div>

      <div className="divider" style={{ marginBottom: 0 }} />

      <div className="scroll-area">

        {/* Scenario selector */}
        <div style={{ marginTop: 16 }}>
          <div className="t-label" style={{ marginBottom: 10 }}>Сценарий</div>
          <div className="scenario-tabs">
            {scenariosArr.map(s => {
              const profit = model.scenarios[s.key].monthly_profit
              return (
                <div key={s.key}
                  className={`scenario-tab ${scenario === s.key ? 'active' : ''}`}
                  onClick={() => setScenario(s.key)}
                >
                  <div className="t-label">{s.emoji} {s.label}</div>
                  <span className="scenario-val" style={{
                    color: scenario === s.key
                      ? (profit >= 0 ? '#fff' : '#fda4af')
                      : (profit >= 0 ? 'var(--text)' : 'var(--rose)')
                  }}>
                    {fmt(profit)}
                  </span>
                  <div className="t-small" style={{
                    marginTop: 2, fontSize: 10,
                    color: scenario === s.key ? 'rgba(255,255,255,0.6)' : 'var(--text-4)'
                  }}>₽/мес</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mini bar chart */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <MiniBarChart
            pess={model.scenarios.pessimistic.monthly_profit}
            base={model.scenarios.base.monthly_profit}
            opt={model.scenarios.optimistic.monthly_profit}
          />
        </div>

        {/* Key metrics */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          {[
            ['📈', 'Выручка / мес',   fmt(sc.monthly_revenue) + ' ₽',   false],
            ['💰', 'Прибыль / мес',   fmt(sc.monthly_profit)  + ' ₽',   sc.monthly_profit < 0],
            ['🎯', 'Точка безубыт.',  `${sc.breakeven_clients} клиентов`, false],
            ['⏱️', 'Окупаемость',     sc.payback_months ? `${sc.payback_months} мес` : '—', !sc.payback_months],
          ].map(([icon, label, val, neg]) => (
            <div key={label as string} className="stat-card">
              <div style={{ fontSize: 18, marginBottom: 4 }}>{icon as string}</div>
              <div className="t-label">{label as string}</div>
              <div className="t-num" style={{
                marginTop: 4, fontSize: 20,
                color: neg ? 'var(--rose)' : 'var(--text)'
              }}>
                {val as string}
              </div>
            </div>
          ))}
        </div>

        {/* Sliders */}
        <div style={{
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)', padding: '16px', marginBottom: 16,
        }}>
          <div className="t-label" style={{ marginBottom: 14 }}>🎚️ Настройте параметры</div>

          <SliderField
            label="Средний чек"
            value={adj.avg_check ?? a.avg_check_rub}
            min={Math.round(a.avg_check_rub * 0.3)}
            max={Math.round(a.avg_check_rub * 3)}
            step={500}
            display={`${fmt(adj.avg_check ?? a.avg_check_rub)} ₽`}
            onChange={v => setAdj(p => ({ ...p, avg_check: v }))}
          />
          <SliderField
            label="Клиентов в месяц"
            value={adj.monthly_clients ?? a.monthly_clients_base}
            min={1}
            max={a.monthly_clients_mature * 2}
            step={1}
            display={`${adj.monthly_clients ?? a.monthly_clients_base} чел.`}
            onChange={v => setAdj(p => ({ ...p, monthly_clients: v }))}
          />
          <SliderField
            label="Постоянные расходы"
            value={adj.fixed_costs ?? a.fixed_costs_monthly.total}
            min={Math.round(a.fixed_costs_monthly.total * 0.4)}
            max={Math.round(a.fixed_costs_monthly.total * 2.5)}
            step={5000}
            display={`${fmt(adj.fixed_costs ?? a.fixed_costs_monthly.total)} ₽`}
            onChange={v => setAdj(p => ({ ...p, fixed_costs: v }))}
          />

          <button className="btn btn-outline btn-sm" onClick={recalculate} disabled={recalculating}>
            {recalculating ? '⏳ Пересчитываем…' : '🔄 Пересчитать'}
          </button>
        </div>

        {/* Unit economics */}
        {ue.cac_rub !== undefined && (
          <div style={{ marginBottom: 16 }}>
            <div className="t-label" style={{ marginBottom: 10 }}>📐 Юнит-экономика</div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
            }}>
              {[
                ['CAC', fmt(ue.cac_rub) + ' ₽',         '💸 Стоимость клиента'],
                ['LTV', fmt(ue.ltv_rub) + ' ₽',         '♻️ Жизненная ценность'],
                ['LTV/CAC', (ue.ltv_cac_ratio||0).toFixed(1), '📊 Коэффициент'],
              ].map(([l, v, hint]) => (
                <div key={l} className="stat-card" style={{ textAlign: 'center', padding: '12px 8px' }}>
                  <div className="t-label">{l}</div>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: 17, fontWeight: 700, margin: '4px 0' }}>{v}</div>
                  <div className="t-small" style={{ fontSize: 10 }}>{hint}</div>
                </div>
              ))}
            </div>
            {ue.ltv_cac_verdict && (
              <div className="badge badge-indigo" style={{ marginTop: 8, display: 'inline-flex' }}>
                {ue.ltv_cac_verdict}
              </div>
            )}
          </div>
        )}

        {/* Warnings */}
        {(model.validation_warnings || []).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {model.validation_warnings.map(w => (
              <div key={w} className="warn-banner">
                <span>⚠️</span>
                <span>{w.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {a.assumptions_notes && (
          <div className="info-block" style={{ marginBottom: 16 }}>
            <div className="t-label" style={{ marginBottom: 6 }}>📝 Допущения модели</div>
            <p className="t-body">{a.assumptions_notes}</p>
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    </div>
  )
}
