import { useRef, useState } from 'react'
import { ChevronLeft } from './Icons'

interface Props {
  ideaId: string; sessionId: string
  ideaTitle: string; isOnline: boolean; onBack: () => void
}

export function AnalyticsScreen({ ideaId, sessionId, ideaTitle, isOnline, onBack }: Props) {

  console.log('AnalyticsScreen render')
  console.log('STATUS:', status)
  console.log('REPORT:', report)
  const [status, setStatus] = useState<'idle'|'loading'|'done'|'error'>('idle')
  const [report, setReport] = useState<any>(null)
  const [error,  setError]  = useState('')
  const [tab,    setTab]    = useState<'market'|'competitors'|'strategy'>('market')

  const pollRef = useRef<number | null>(null)
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('nexus_token')}` }

  async function start() {
    console.log('START CLICKED')
    setStatus('loading')
  
    try {
      console.log('API URL:', import.meta.env.VITE_API_URL)
      console.log('TOKEN:', localStorage.getItem('nexus_token'))
      console.log('SESSION:', sessionId)
      console.log('IDEA:', ideaId)
      const url = `${import.meta.env.VITE_API_URL}/api/analytics/${sessionId}/${ideaId}`
  
      console.log('FETCH URL:', url)
  
      const r = await fetch(url, {
        method: 'POST',
        headers: H
      })
  
      console.log('POST RESPONSE:', r.status)
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/analytics/${sessionId}/${ideaId}`,
        {
          method: 'POST',
          headers: H
        }
      )
  
      pollRef.current = window.setInterval(async () => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/analytics/${sessionId}/${ideaId}`,
            {
              headers: H
            }
          )
  
          // backend еще не успел подготовить результат
          if (res.status === 404) {
            console.log('analytics not ready yet')
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
  
            setReport(d.report)
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
      }, 3500)
  
      setTimeout(() => {
        if (pollRef.current) {
          clearInterval(pollRef.current)
        }
      }, 180_000)
  
    } catch (e: unknown) {
      setError((e as Error).message)
      setStatus('error')
    }
  }

  function Dot({ q }: { q?: string }) {
    const c = q === 'good' ? 'var(--lime)' : q === 'partial' ? 'var(--amber)' : 'var(--rose)'
    const t = q === 'good' ? 'Хорошие данные' : q === 'partial' ? 'Частичные данные' : 'Ограниченные данные'
    return <span style={{ fontSize: 11, color: c, fontFamily: 'var(--f)', fontWeight: 700 }}>● {t}</span>
  }

  function TBadge({ t }: { t?: string }) {
    const m: Record<string, [string,string]> = { growing: ['↑ Растёт','var(--lime)'], stable: ['→ Стабильно','var(--t3)'], declining: ['↓ Падает','var(--rose)'] }
    const [l, c] = m[t||'stable'] || m.stable
    return <span style={{ fontFamily:'var(--f)', fontSize:12, fontWeight:700, color:c }}>{l}</span>
  }

  function SBadge({ s }: { s?: string }) {
    const m: Record<string, [string,string]> = { low:['Низкая','var(--lime)'], medium:['Средняя','var(--amber)'], high:['Высокая','var(--rose)'] }
    const [l, c] = m[s||'medium'] || m.medium
    return <span style={{ fontFamily:'var(--f)', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:100, background:`${c}18`, color:c }}>{l} насыщенность</span>
  }

  const TABS = [
    { key: 'market'      as const, label: '📊 Рынок' },
    { key: 'competitors' as const, label: '⚔️ Конкуренты' },
    { key: 'strategy'    as const, label: '🎯 Стратегия' },
  ]
  console.log('BEFORE RETURN')
  return (
    <div className="screen">
      <button className="btn btn-ghost" onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:16 }}>
        <ChevronLeft size={15}/><span>Идея</span>
      </button>
      <div className="t-label" style={{ marginBottom:3, color:'var(--lime)' }}>{ideaTitle}</div>
      <div className="t-title" style={{ marginBottom:4 }}>Рыночная аналитика</div>
      <div className="t-small" style={{ marginBottom:20 }}>
        Поиск по реальным данным: конкуренты · рынок{isOnline ? ' · маркетплейсы' : ''}
      </div>

      {status === 'idle' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:14, justifyContent:'center' }}>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--b2)', borderRadius:'var(--r-lg)', padding:18 }}>
            <div style={{ fontFamily:'var(--f)', fontSize:14, fontWeight:700, color:'var(--t1)', marginBottom:14 }}>Что будет проанализировано</div>
            {[
              ['🔍','Конкуренты', isOnline ? 'Сервисы и платформы-аналоги в России' : `Компании по нише в вашем городе`],
              ['📦', isOnline ? 'Маркетплейсы' : 'Объём рынка', isOnline ? 'WB / Ozon — продавцы, уровень конкуренции' : 'Объём, тренды, насыщенность ниши'],
              ['📈','Тренды 2024–2025','Растёт или падает ниша, ключевые события'],
              ['🎯','Стратегии конкурентов','Что делают лидеры, их слабые места, ниши'],
            ].map(([icon, t, d]) => (
              <div key={t as string} style={{ display:'flex', gap:12, marginBottom:10, alignItems:'flex-start' }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{icon as string}</span>
                <div>
                  <div style={{ fontFamily:'var(--f)', fontSize:13, fontWeight:600, color:'var(--t1)', marginBottom:2 }}>{t as string}</div>
                  <div className="t-small">{d as string}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background:'var(--lime-dim)', border:'1px solid rgba(170,255,62,0.2)', borderRadius:'var(--r)', padding:'11px 14px' }}>
            <div className="t-small" style={{ color:'var(--lime)', lineHeight:1.5 }}>
              ⚡ Используется Tavily Web Search. Добавьте <code style={{ fontFamily:'var(--fm)', fontSize:11 }}>TAVILY_API_KEY</code> в .env для реального поиска.
              Без ключа — анализ на основе знаний LLM.
            </div>
          </div>

          <button className="btn btn-primary" onClick={start}>🔍 Запустить анализ рынка</button>
        </div>
      )}

      {status === 'loading' && (
        <div className="loader-wrap">
          <div className="loader-ring"/>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'var(--f)', fontSize:15, fontWeight:700, color:'var(--t1)', marginBottom:4 }}>Анализируем рынок</div>
            <div className="t-small">Ищем данные о конкурентах{isOnline?' и маркетплейсах':''}…</div>
          </div>
          <div style={{ width:'100%', maxWidth:260 }}>
            <div className="progress-track"><div className="progress-fill" style={{ width:'55%' }}/></div>
            <div className="t-small" style={{ textAlign:'center', marginTop:6 }}>~20–40 секунд</div>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="info-block info-block-rose">
          <p style={{ color:'var(--rose)', fontSize:13, fontFamily:'var(--f)', marginBottom:12 }}>{error}</p>
          <button className="btn btn-outline btn-sm" onClick={start} style={{ width:'auto' }}>Повторить</button>
        </div>
      )}

      {status === 'done' && report && (
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          {/* Summary banner */}
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--b2)', borderRadius:'var(--r)', padding:'12px 14px', marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <Dot q={report.data_quality}/>
              {report.market_overview && <TBadge t={report.market_overview.trend}/>}
            </div>
            {report.recommendation && (
              <div style={{ fontFamily:'var(--f)', fontSize:13, fontWeight:600, color:'var(--t1)', lineHeight:1.4 }}>
                {report.recommendation}
              </div>
            )}
            {report.data_quality_note && <div className="t-small" style={{ marginTop:6 }}>{report.data_quality_note}</div>}
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                fontFamily:'var(--f)', fontSize:12, fontWeight:700,
                padding:'7px 13px', borderRadius:100, border:'1px solid',
                cursor:'pointer', transition:'all 0.13s',
                background:  tab===t.key ? 'var(--lime-dim)'          : 'var(--bg-card)',
                color:       tab===t.key ? 'var(--lime)'               : 'var(--t3)',
                borderColor: tab===t.key ? 'rgba(170,255,62,0.3)'     : 'var(--b2)',
              }}>{t.label}</button>
            ))}
          </div>

          <div className="scroll-area">

            {tab === 'market' && report.market_overview && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div className="info-block">
                  <div className="t-label" style={{ marginBottom:8 }}>📦 Объём рынка</div>
                  <div style={{ fontFamily:'var(--f)', fontSize:16, fontWeight:700, color:'var(--t1)', marginBottom:8 }}>
                    {report.market_overview.volume_estimate}
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <TBadge t={report.market_overview.trend}/>
                    <SBadge s={report.market_overview.saturation}/>
                  </div>
                  {report.market_overview.trend_evidence && <div className="t-small" style={{ marginTop:8 }}>📎 {report.market_overview.trend_evidence}</div>}
                  {report.market_overview.saturation_note && <div className="t-small" style={{ marginTop:4 }}>💡 {report.market_overview.saturation_note}</div>}
                </div>

                {report.marketplace_presence?.relevant && (
                  <div className="info-block">
                    <div className="t-label" style={{ marginBottom:8 }}>📦 Маркетплейсы</div>
                    {report.marketplace_presence.seller_count_estimate && (
                      <div style={{ fontFamily:'var(--fm)', fontSize:18, fontWeight:700, color:'var(--teal)', marginBottom:6 }}>
                        ~{report.marketplace_presence.seller_count_estimate} продавцов
                      </div>
                    )}
                    <div className="t-small">{report.marketplace_presence.key_finding}</div>
                  </div>
                )}

                {(report.entry_barriers||[]).length > 0 && (
                  <div className="info-block info-block-amber">
                    <div className="t-label" style={{ marginBottom:8, color:'var(--amber)' }}>🚧 Барьеры входа</div>
                    {report.entry_barriers.map((b: string, i: number) => (
                      <div key={i} style={{ display:'flex', gap:8, marginBottom:5 }}>
                        <span style={{ color:'var(--amber)', fontFamily:'var(--fm)', fontSize:11, flexShrink:0 }}>{i+1}.</span>
                        <span className="t-small" style={{ color:'var(--t2)' }}>{b}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'competitors' && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {(report.competitors||[]).length === 0 ? (
                  <div className="info-block"><div className="t-small">Конкретные конкуренты не найдены. Добавьте TAVILY_API_KEY для реального поиска.</div></div>
                ) : (
                  (report.competitors||[]).map((c: any, i: number) => (
                    <div key={i} className="info-block">
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <div style={{ fontFamily:'var(--f)', fontSize:14, fontWeight:700, color:'var(--t1)' }}>{c.name}</div>
                        {c.estimated_revenue && <span className="badge badge-teal">{c.estimated_revenue}</span>}
                      </div>
                      {c.positioning && <div className="t-small" style={{ marginBottom:6 }}>🎯 {c.positioning}</div>}
                      {c.weakness && (
                        <div style={{ display:'flex', gap:6 }}>
                          <span style={{ fontSize:13, flexShrink:0 }}>⚡</span>
                          <div className="t-small" style={{ color:'var(--lime)' }}>Слабое место: {c.weakness}</div>
                        </div>
                      )}
                      {c.source && <div className="t-small" style={{ marginTop:5, opacity:0.4 }}>Источник: {c.source}</div>}
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'strategy' && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {(report.gaps||[]).length > 0 && (
                  <div className="info-block info-block-lime">
                    <div className="t-label" style={{ marginBottom:10, color:'var(--lime)' }}>🟢 Незанятые ниши</div>
                    {report.gaps.map((g: string, i: number) => (
                      <div key={i} style={{ display:'flex', gap:8, marginBottom:7 }}>
                        <span style={{ color:'var(--lime)', fontFamily:'var(--fm)', fontSize:11, flexShrink:0 }}>→</span>
                        <span className="t-small" style={{ color:'var(--t1)', lineHeight:1.5 }}>{g}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(report.competitor_strategies||[]).length > 0 && (
                  <div className="info-block">
                    <div className="t-label" style={{ marginBottom:10 }}>🔍 Что делают конкуренты</div>
                    {report.competitor_strategies.map((s: string, i: number) => (
                      <div key={i} style={{ display:'flex', gap:8, marginBottom:7 }}>
                        <span style={{ color:'var(--amber)', fontFamily:'var(--fm)', fontSize:11, flexShrink:0 }}>{i+1}.</span>
                        <span className="t-small" style={{ lineHeight:1.5 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!(report.gaps?.length) && !(report.competitor_strategies?.length) && (
                  <div className="info-block"><div className="t-small">Стратегические данные недоступны. Добавьте TAVILY_API_KEY.</div></div>
                )}
              </div>
            )}

            <div style={{ height:32 }}/>
          </div>
        </div>
      )}
    </div>
  )
}
