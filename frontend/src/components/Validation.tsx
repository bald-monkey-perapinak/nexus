import { useState, useEffect } from 'react'
import { ChevronLeft, ValidationIllustration } from './Icons'

interface ValidationProps {
  ideaId: string
  sessionId: string
  ideaTitle: string
  onBack: () => void
}

export function ValidationScreen({ ideaId, sessionId, ideaTitle, onBack }: ValidationProps) {
  const [status, setStatus]           = useState<'idle'|'loading'|'done'|'error'>('idle')
  const [data, setData]               = useState<any>(null)
  const [activeTab, setActiveTab]     = useState<'hypotheses'|'custdev'|'mvp'>('hypotheses')
  const [error, setError]             = useState('')

  async function start() {
    setStatus('loading')
    try {
      const token = localStorage.getItem('nexus_token')
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

      // Start
      await fetch(`/api/validation/${sessionId}/${ideaId}`, { method: 'POST', headers })

      // Poll
      const poll = setInterval(async () => {
        const r = await fetch(`/api/validation/${sessionId}/${ideaId}`, { headers })
        const d = await r.json()
        if (d.status === 'done') {
          clearInterval(poll)
          setData(d)
          setStatus('done')
        } else if (d.status === 'error') {
          clearInterval(poll)
          setError(d.error || 'Ошибка')
          setStatus('error')
        }
      }, 3000)

      setTimeout(() => clearInterval(poll), 120_000)
    } catch (e: unknown) {
      setError((e as Error).message)
      setStatus('error')
    }
  }

  const tabs = [
    { key: 'hypotheses' as const, label: '🔬 Гипотезы', count: data?.hypotheses?.length },
    { key: 'custdev'    as const, label: '🎤 CustDev',  count: data?.custdev_script?.questions?.length },
    { key: 'mvp'        as const, label: '🚀 MVP-тест', count: data?.mvp_tests?.length },
  ]

  return (
    <div className="screen">

      <button className="btn btn-ghost" onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <ChevronLeft size={16} /><span>Идея</span>
      </button>

      <div className="t-label" style={{ marginBottom: 4 }}>{ideaTitle}</div>
      <div className="t-title" style={{ marginBottom: 4 }}>Валидация гипотез</div>
      <div className="t-small" style={{ marginBottom: 20 }}>
        CustDev-скрипт и MVP-тест перед запуском
      </div>

      {status === 'idle' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ValidationIllustration />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['🔬', 'Критические гипотезы', 'Конкретные, проверяемые, с числами'],
              ['🎤', 'Скрипт CustDev-интервью', 'Вопросы для 15 интервью с потенциальными клиентами'],
              ['🚀', 'MVP-тест', '2–3 варианта проверки спроса без полного запуска'],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                background: 'var(--bg-2)', border: '1px solid var(--border)',
                borderRadius: 'var(--r)', padding: '12px 14px',
              }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
                  <div className="t-small">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-primary" onClick={start}>
            ✅ Запустить анализ
          </button>
        </div>
      )}

      {status === 'loading' && (
        <div className="loader-wrap">
          <div className="loader-spinner" />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Анализируем гипотезы</div>
            <div className="t-small">Groq генерирует CustDev-скрипт и MVP-тест…</div>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="info-block info-block-risk">
          <p style={{ color: 'var(--rose)', fontSize: 13 }}>{error}</p>
          <button className="btn btn-outline btn-sm" onClick={start} style={{ marginTop: 12, width: 'auto' }}>
            Повторить
          </button>
        </div>
      )}

      {status === 'done' && data && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {tabs.map(t => (
              <button key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  fontSize: 13, fontWeight: 500, padding: '7px 14px',
                  borderRadius: 100, border: '1.5px solid',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: activeTab === t.key ? 'var(--indigo)' : 'var(--bg)',
                  color:      activeTab === t.key ? '#fff' : 'var(--text-3)',
                  borderColor: activeTab === t.key ? 'var(--indigo)' : 'var(--border)',
                }}
              >
                {t.label} {t.count ? `(${t.count})` : ''}
              </button>
            ))}
          </div>

          <div className="scroll-area">

            {/* Hypotheses tab */}
            {activeTab === 'hypotheses' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(data.hypotheses || []).map((h: any, i: number) => (
                  <div key={h.id} className="info-block">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="badge badge-indigo">H{i+1}</span>
                      <span className={`badge ${h.priority === 'critical' ? 'badge-rose' : h.priority === 'important' ? 'badge-amber' : 'badge-neutral'}`}>
                        {h.priority === 'critical' ? '🔴 Критическая' : h.priority === 'important' ? '🟡 Важная' : '🟢 Желательная'}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 8, lineHeight: 1.5 }}>
                      {h.statement}
                    </p>
                    {h.risk_if_wrong && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 13 }}>⚠️</span>
                        <p className="t-small">Если ложная: {h.risk_if_wrong}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* CustDev tab */}
            {activeTab === 'custdev' && data.custdev_script && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                <div className="info-block info-block-success">
                  <div className="t-label" style={{ marginBottom: 6 }}>🎯 Кого искать</div>
                  <p className="t-body">{data.custdev_script.target_respondent}</p>
                </div>

                {data.custdev_script.where_to_find && (
                  <div className="info-block">
                    <div className="t-label" style={{ marginBottom: 8 }}>📍 Где найти</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {data.custdev_script.where_to_find.map((w: string) => (
                        <span key={w} className="badge badge-indigo">📌 {w}</span>
                      ))}
                    </div>
                  </div>
                )}

                {data.custdev_script.opening && (
                  <div className="info-block">
                    <div className="t-label" style={{ marginBottom: 6 }}>💬 Вступление</div>
                    <p className="t-body" style={{ fontStyle: 'italic' }}>"{data.custdev_script.opening}"</p>
                  </div>
                )}

                <div className="t-label" style={{ marginTop: 4 }}>
                  ❓ Вопросы ({(data.custdev_script.questions||[]).length})
                </div>
                {(data.custdev_script.questions || []).map((q: any, i: number) => (
                  <div key={i} className="info-block">
                    <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: 'var(--indigo)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>{i+1}</div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>{q.text}</p>
                    </div>
                    {q.purpose && <p className="t-small">→ Проверяет: {q.purpose}</p>}
                    {q.follow_up && <p className="t-small" style={{ marginTop: 4 }}>↳ Уточнение: {q.follow_up}</p>}
                  </div>
                ))}

                {data.custdev_script.success_criteria && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="info-block info-block-success">
                      <div className="t-label" style={{ marginBottom: 6, color: 'var(--emerald)' }}>✅ Идти вперёд</div>
                      <p className="t-small">{data.custdev_script.success_criteria.go}</p>
                    </div>
                    <div className="info-block info-block-risk">
                      <div className="t-label" style={{ marginBottom: 6, color: 'var(--rose)' }}>🛑 Стоп</div>
                      <p className="t-small">{data.custdev_script.success_criteria.stop}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MVP tab */}
            {activeTab === 'mvp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(data.mvp_tests || []).map((test: any, i: number) => (
                  <div key={i} className="info-block">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="badge badge-indigo">Вариант {i+1}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span className="badge badge-neutral">💰 {(test.budget_rub||0).toLocaleString()} ₽</span>
                        <span className="badge badge-neutral">📅 {test.duration_days} дн</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{test.name}</div>
                    <p className="t-body" style={{ marginBottom: 10 }}>{test.description}</p>
                    {test.success_metric && (
                      <div className="badge badge-emerald" style={{ marginBottom: 10 }}>
                        🎯 Успех: {test.success_metric}
                      </div>
                    )}
                    {test.steps && (
                      <div>
                        <div className="t-label" style={{ marginBottom: 6 }}>Шаги</div>
                        {test.steps.map((s: string, j: number) => (
                          <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                            <span style={{ color: 'var(--indigo)', fontWeight: 700, fontSize: 12 }}>{j+1}.</span>
                            <span className="t-small">{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ height: 32 }} />
          </div>
        </div>
      )}
    </div>
  )
}
