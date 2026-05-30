import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ValidationIllustration } from './Icons'

interface Props { ideaId: string; sessionId: string; ideaTitle: string; onBack: () => void }

export function ValidationScreen({ ideaId, sessionId, ideaTitle, onBack }: Props) {
  const [status, setStatus] = useState<'idle'|'loading'|'done'|'error'>('idle')
  const [data,   setData]   = useState<any>(null)
  const [tab,    setTab]    = useState<'hypotheses'|'custdev'|'mvp'>('hypotheses')
  const [error,  setError]  = useState('')

  const pollRef = useRef<number | null>(null)

  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('nexus_token')}` }
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
    }
  }, [])
  async function start() {
    setStatus('loading')
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/validation/${sessionId}/${ideaId}`, { method: 'POST', headers: h })
          pollRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/validation/${sessionId}/${ideaId}`,
          { headers: h }
        )
    
        // backend еще не создал результат
        if (res.status === 404) {
          console.log('validation not ready yet')
          return
        }
    
        if (!res.ok) {
          if (pollRef.current) {
            clearInterval(pollRef.current)
          }
          setError(`HTTP ${res.status}`)
          setStatus('error')
          return
        }
    
        const d = await res.json()
    
        if (d.status === 'done') {
          if (pollRef.current) {
            clearInterval(pollRef.current)
          }
          setData(d)
          setStatus('done')
        }
    
        if (d.status === 'error') {
          if (pollRef.current) {
            clearInterval(pollRef.current)
          }
          setError(d.error || 'Ошибка')
          setStatus('error')
        }
    
      } catch (e) {
        if (pollRef.current) {
          clearInterval(pollRef.current)
        }
        setError((e as Error).message)
        setStatus('error')
      }
    }, 3200)
      setTimeout(() => {
        if (pollRef.current) {
          clearInterval(pollRef.current)
        }
      }, 120_000)
    } catch (e: unknown) { setError((e as Error).message); setStatus('error') }
  }

  const TABS = [
    { key: 'hypotheses' as const, label: '🔬 Гипотезы', n: data?.hypotheses?.length },
    { key: 'custdev'    as const, label: '🎤 CustDev',  n: data?.custdev_script?.questions?.length },
    { key: 'mvp'        as const, label: '🚀 MVP‑тест', n: data?.mvp_tests?.length },
  ]

  return (
    <div className="screen">
      <button className="btn btn-ghost" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <ChevronLeft size={15}/><span>Идея</span>
      </button>
      <div className="t-label" style={{ marginBottom: 3, color: 'var(--lime)' }}>{ideaTitle}</div>
      <div className="t-title" style={{ marginBottom: 4 }}>Валидация гипотез</div>
      <div className="t-small" style={{ marginBottom: 20 }}>CustDev‑скрипт и MVP‑тест перед запуском</div>

      {status === 'idle' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:20, justifyContent:'center' }}>
          <div style={{ display:'flex', justifyContent:'center' }}><ValidationIllustration /></div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[['🔬','Гипотезы','Конкретные и проверяемые, с числами'],
              ['🎤','CustDev‑скрипт','Вопросы для 15 интервью с клиентами'],
              ['🚀','MVP‑тест','2–3 варианта проверки спроса без запуска']].map(([icon,t,d]) => (
              <div key={t} style={{ display:'flex', gap:12, alignItems:'flex-start', background:'var(--bg-card)', border:'1px solid var(--b2)', borderRadius:'var(--r)', padding:'12px 14px' }}>
                <span style={{ fontSize:20 }}>{icon}</span>
                <div>
                  <div style={{ fontFamily:'var(--f)', fontSize:13, fontWeight:700, color:'var(--t1)', marginBottom:2 }}>{t}</div>
                  <div className="t-small">{d}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={start}>✅ Запустить анализ</button>
        </div>
      )}

      {status === 'loading' && (
        <div className="loader-wrap">
          <div className="loader-ring"/>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'var(--f)', fontSize:15, fontWeight:700, color:'var(--t1)', marginBottom:4 }}>Анализируем гипотезы</div>
            <div className="t-small">Groq генерирует CustDev‑скрипт…</div>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="info-block info-block-rose">
          <p style={{ color:'var(--rose)', fontSize:13, marginBottom:12, fontFamily:'var(--f)' }}>{error}</p>
          <button className="btn btn-outline btn-sm" onClick={start} style={{ width:'auto' }}>Повторить</button>
        </div>
      )}

      {status === 'done' && data && (
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          {/* Tab bar */}
          <div style={{ display:'flex', gap:7, marginBottom:16, flexWrap:'wrap' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                fontFamily:'var(--f)', fontSize:12, fontWeight:700, padding:'7px 13px',
                borderRadius:100, border:'1px solid', cursor:'pointer', transition:'all 0.13s',
                background: tab === t.key ? 'var(--lime-dim)'          : 'var(--bg-card)',
                color:      tab === t.key ? 'var(--lime)'               : 'var(--t3)',
                borderColor: tab === t.key ? 'rgba(170,255,62,0.3)'    : 'var(--b2)',
              }}>
                {t.label}{t.n ? ` (${t.n})` : ''}
              </button>
            ))}
          </div>

          <div className="scroll-area">
            {/* Hypotheses */}
            {tab === 'hypotheses' && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {(data.hypotheses || []).map((h: any, i: number) => (
                  <div key={h.id} className="info-block">
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <span className="badge badge-lime">H{i+1}</span>
                      <span className={`badge ${h.priority==='critical'?'badge-rose':h.priority==='important'?'badge-amber':'badge-neutral'}`}>
                        {h.priority==='critical'?'🔴 Критичная':h.priority==='important'?'🟡 Важная':'🟢 Желательная'}
                      </span>
                    </div>
                    <p style={{ fontFamily:'var(--f)', fontSize:14, fontWeight:600, color:'var(--t1)', marginBottom:8, lineHeight:1.45 }}>{h.statement}</p>
                    {h.risk_if_wrong && <div className="t-small">⚠️ Если ложная: {h.risk_if_wrong}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* CustDev */}
            {tab === 'custdev' && data.custdev_script && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div className="info-block info-block-lime">
                  <div className="t-label" style={{ marginBottom:6, color:'var(--lime)' }}>🎯 Кого искать</div>
                  <p className="t-body" style={{ color:'var(--t1)' }}>{data.custdev_script.target_respondent}</p>
                </div>
                {data.custdev_script.where_to_find && (
                  <div className="info-block">
                    <div className="t-label" style={{ marginBottom:7 }}>📍 Где найти</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {data.custdev_script.where_to_find.map((w: string) => <span key={w} className="badge badge-lime">📌 {w}</span>)}
                    </div>
                  </div>
                )}
                {data.custdev_script.opening && (
                  <div className="info-block">
                    <div className="t-label" style={{ marginBottom:6 }}>💬 Вступление</div>
                    <p className="t-body" style={{ fontStyle:'italic', color:'var(--t2)' }}>"{data.custdev_script.opening}"</p>
                  </div>
                )}
                <div className="t-label" style={{ margin:'4px 0 8px', color:'var(--t3)' }}>❓ Вопросы ({(data.custdev_script.questions||[]).length})</div>
                {(data.custdev_script.questions || []).map((q: any, i: number) => (
                  <div key={i} className="info-block">
                    <div style={{ display:'flex', gap:10, marginBottom:6 }}>
                      <div style={{ width:24, height:24, borderRadius:6, background:'var(--lime-dim)', border:'1px solid rgba(170,255,62,0.2)', color:'var(--lime)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--fm)', fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</div>
                      <p style={{ fontFamily:'var(--f)', fontSize:14, fontWeight:600, color:'var(--t1)', lineHeight:1.4 }}>{q.text}</p>
                    </div>
                    {q.purpose   && <div className="t-small">→ Проверяет: {q.purpose}</div>}
                    {q.follow_up && <div className="t-small" style={{ marginTop:3 }}>↳ Уточнение: {q.follow_up}</div>}
                  </div>
                ))}
                {data.custdev_script.success_criteria && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div className="info-block info-block-lime">
                      <div className="t-label" style={{ marginBottom:5, color:'var(--lime)' }}>✅ Идти вперёд</div>
                      <p className="t-small" style={{ color:'var(--t2)' }}>{data.custdev_script.success_criteria.go}</p>
                    </div>
                    <div className="info-block info-block-rose">
                      <div className="t-label" style={{ marginBottom:5, color:'var(--rose)' }}>🛑 Стоп</div>
                      <p className="t-small" style={{ color:'var(--t2)' }}>{data.custdev_script.success_criteria.stop}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MVP */}
            {tab === 'mvp' && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {(data.mvp_tests || []).map((t: any, i: number) => (
                  <div key={i} className="info-block">
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <span className="badge badge-lime">Вариант {i+1}</span>
                      <div style={{ display:'flex', gap:6 }}>
                        <span className="badge badge-neutral">💰 {(t.budget_rub||0).toLocaleString()} ₽</span>
                        <span className="badge badge-neutral">📅 {t.duration_days} дн</span>
                      </div>
                    </div>
                    <div style={{ fontFamily:'var(--f)', fontSize:14, fontWeight:700, color:'var(--t1)', marginBottom:7 }}>{t.name}</div>
                    <p className="t-body" style={{ marginBottom:10 }}>{t.description}</p>
                    {t.success_metric && <div className="badge badge-teal" style={{ marginBottom:10, display:'inline-flex' }}>🎯 {t.success_metric}</div>}
                    {t.steps && (
                      <div>
                        <div className="t-label" style={{ marginBottom:6 }}>Шаги</div>
                        {t.steps.map((s: string, j: number) => (
                          <div key={j} style={{ display:'flex', gap:8, marginBottom:4 }}>
                            <span style={{ color:'var(--lime)', fontFamily:'var(--fm)', fontWeight:700, fontSize:11, flexShrink:0 }}>{j+1}.</span>
                            <span className="t-small">{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div style={{ height:32 }}/>
          </div>
        </div>
      )}
    </div>
  )
}
