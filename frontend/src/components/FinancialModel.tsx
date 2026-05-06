import { useState, useEffect } from 'react'
import type { IdeaCard, FinancialModel } from '../types'
import { createFinancialModel } from '../api'
import { ChevronLeft, MiniBarChart } from './Icons'

interface Props { idea: IdeaCard; sessionId: string; onBack: () => void }

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  const s = n < 0 ? '−' : ''; const a = Math.abs(n)
  if (a >= 1_000_000) return `${s}${(a/1_000_000).toFixed(1)} млн`
  if (a >= 1_000)     return `${s}${(a/1000).toFixed(0)} тыс`
  return `${s}${Math.round(a)}`
}

function Slider({ label, value, min, max, step, display, onChange }: {
  label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div className="form-label">{label}</div>
        <div style={{ fontFamily: 'var(--fm)', fontSize: 14, fontWeight: 700, color: 'var(--lime)' }}>{display}</div>
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

export function FinancialModelScreen({ idea, sessionId, onBack }: Props) {
  const [model,    setModel]    = useState<FinancialModel | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [recalc,   setRecalc]   = useState(false)
  const [error,    setError]    = useState('')
  const [adj,      setAdj]      = useState<Record<string, number>>({})
  const [scenario, setScenario] = useState<'pessimistic'|'base'|'optimistic'>('base')

  async function load(adjustments: Record<string, number> = {}) {
    try {
      const r = await createFinancialModel(sessionId, idea.id, adjustments) as FinancialModel
      setModel(r)
      if (!Object.keys(adj).length) setAdj({ avg_check: r.assumptions.avg_check_rub, monthly_clients: r.assumptions.monthly_clients_base, fixed_costs: r.assumptions.fixed_costs_monthly.total })
    } catch (e: unknown) { setError((e as Error).message) }
  }

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  if (loading) return (
    <div className="screen"><div className="loader-wrap">
      <div className="loader-ring" />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--f)', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Строим модель</div>
        <div className="t-small">Генерируем допущения для ниши…</div>
      </div>
    </div></div>
  )

  if (error || !model) return (
    <div className="screen">
      <button className="btn btn-ghost" onClick={onBack}><ChevronLeft size={15}/> Назад</button>
      <div style={{ marginTop: 24, color: 'var(--rose)', fontSize: 13, fontFamily: 'var(--f)' }}>{error || 'Ошибка'}</div>
    </div>
  )

  const a  = model.assumptions
  const sc = model.scenarios[scenario]
  const ue = model.unit_economics || {}

  const SCENARIOS = [
    { key: 'pessimistic' as const, label: 'Пессим.',   emoji: '😐' },
    { key: 'base'        as const, label: 'Базовый',   emoji: '📊' },
    { key: 'optimistic'  as const, label: 'Оптимист.', emoji: '🚀' },
  ]

  return (
    <div className="screen">
      <button className="btn btn-ghost" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <ChevronLeft size={15}/><span>Идея</span>
      </button>

      <div className="t-label" style={{ marginBottom: 3, color: 'var(--lime)' }}>{idea.title}</div>
      <div className="t-title" style={{ marginBottom: 16 }}>Финансовая модель</div>

      <div className="divider divider-lime" style={{ marginBottom: 0 }} />

      <div className="scroll-area">

        {/* Scenarios */}
        <div style={{ marginTop: 14 }}>
          <div className="t-label" style={{ marginBottom: 10 }}>Сценарий</div>
          <div className="scenario-tabs">
            {SCENARIOS.map(s => {
              const profit = model.scenarios[s.key].monthly_profit
              const active = scenario === s.key
              return (
                <div key={s.key} className={`scenario-tab ${active ? 'active' : ''}`} onClick={() => setScenario(s.key)}>
                  <div className="t-label">{s.emoji} {s.label}</div>
                  <span className="scenario-val" style={{ color: active ? (profit >= 0 ? 'var(--lime)' : 'var(--rose)') : (profit >= 0 ? 'var(--t1)' : 'var(--rose)') }}>
                    {fmt(profit)}
                  </span>
                  <div className="t-small" style={{ fontSize: 10, marginTop: 2, color: active ? 'var(--t3)' : 'var(--t4)' }}>₽/мес</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mini chart */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 16px' }}>
          <MiniBarChart pess={model.scenarios.pessimistic.monthly_profit} base={model.scenarios.base.monthly_profit} opt={model.scenarios.optimistic.monthly_profit} />
        </div>

        {/* Metrics */}
        <div className="stats-grid" style={{ marginBottom: 16 }}>
          {([
            ['📈', 'Выручка / мес',  fmt(sc.monthly_revenue) + ' ₽',                  false],
            ['💰', 'Прибыль / мес',  fmt(sc.monthly_profit)  + ' ₽',                  sc.monthly_profit < 0],
            ['🎯', 'Точка безубыт.', `${sc.breakeven_clients} кл.`,                    false],
            ['⏱️', 'Окупаемость',    sc.payback_months ? `${sc.payback_months} мес` : '—', !sc.payback_months],
          ] as [string, string, string, boolean][]).map(([icon, label, val, neg]) => (
            <div key={label} className="stat-card">
              <div style={{ fontSize: 18, marginBottom: 5 }}>{icon}</div>
              <div className="t-label">{label}</div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: 20, fontWeight: 700, marginTop: 4, color: neg ? 'var(--rose)' : 'var(--t1)', lineHeight: 1 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Sliders */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--b2)', borderRadius: 'var(--r-lg)', padding: 16, marginBottom: 14 }}>
          <div className="t-label" style={{ marginBottom: 14, color: 'var(--lime)' }}>🎚️ Настройте параметры</div>
          <Slider label="Средний чек" value={adj.avg_check ?? a.avg_check_rub}
            min={Math.round(a.avg_check_rub * 0.3)} max={Math.round(a.avg_check_rub * 3)} step={500}
            display={`${fmt(adj.avg_check ?? a.avg_check_rub)} ₽`}
            onChange={v => setAdj(p => ({ ...p, avg_check: v }))} />
          <Slider label="Клиентов / мес" value={adj.monthly_clients ?? a.monthly_clients_base}
            min={1} max={a.monthly_clients_mature * 2} step={1}
            display={`${adj.monthly_clients ?? a.monthly_clients_base} чел.`}
            onChange={v => setAdj(p => ({ ...p, monthly_clients: v }))} />
          <Slider label="Фикс. расходы" value={adj.fixed_costs ?? a.fixed_costs_monthly.total}
            min={Math.round(a.fixed_costs_monthly.total * 0.4)} max={Math.round(a.fixed_costs_monthly.total * 2.5)} step={5000}
            display={`${fmt(adj.fixed_costs ?? a.fixed_costs_monthly.total)} ₽`}
            onChange={v => setAdj(p => ({ ...p, fixed_costs: v }))} />
          <button className="btn btn-outline btn-sm" onClick={async () => { setRecalc(true); await load(adj); setRecalc(false) }} disabled={recalc}>
            {recalc ? '⏳ Пересчитываем…' : '🔄 Пересчитать'}
          </button>
        </div>

        {/* Unit economics */}
        {ue.cac_rub !== undefined && (
          <div style={{ marginBottom: 14 }}>
            <div className="t-label" style={{ marginBottom: 10, color: 'var(--teal)' }}>📐 Юнит‑экономика</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {([['CAC', fmt(ue.cac_rub)+' ₽'],['LTV', fmt(ue.ltv_rub)+' ₽'],['LTV/CAC', (ue.ltv_cac_ratio||0).toFixed(1)]] as [string,string][]).map(([l,v]) => (
                <div key={l} className="stat-card" style={{ textAlign: 'center', padding: '11px 8px' }}>
                  <div className="t-label">{l}</div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: 17, fontWeight: 700, marginTop: 4, color: 'var(--teal)' }}>{v}</div>
                </div>
              ))}
            </div>
            {ue.ltv_cac_verdict && <div className="badge badge-teal" style={{ marginTop: 8, display: 'inline-flex' }}>{ue.ltv_cac_verdict}</div>}
          </div>
        )}

        {(model.validation_warnings || []).map(w => (
          <div key={w} className="warn-banner"><span>⚠️</span><span>{w.replace(/_/g,' ')}</span></div>
        ))}

        {a.assumptions_notes && (
          <div className="info-block" style={{ marginBottom: 14 }}>
            <div className="t-label" style={{ marginBottom: 6 }}>📝 Допущения</div>
            <p className="t-body">{a.assumptions_notes}</p>
          </div>
        )}
        <div style={{ height: 32 }} />
      </div>
    </div>
  )
}
