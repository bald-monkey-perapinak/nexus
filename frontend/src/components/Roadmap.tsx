import { useState } from 'react'
import { ChevronLeft, RoadmapIllustration, CategoryIcon } from './Icons'

interface Props { ideaId: string; sessionId: string; ideaTitle: string; onBack: () => void }
type Status = 'todo' | 'in_progress' | 'done'

interface Task {
  id: string; week: number; title: string; description: string
  category: string; priority: string; deadline: string
  resources?: string[]; status: Status; source_flag?: string
}

const CAT: Record<string, { label: string; color: string }> = {
  legal:     { label: 'Юридика',   color: '#AAFF3E' },
  finance:   { label: 'Финансы',   color: '#00E5CC' },
  marketing: { label: 'Маркетинг', color: '#FFB800' },
  ops:       { label: 'Операции',  color: '#7C9AFF' },
  hiring:    { label: 'Найм',      color: '#D67AFF' },
  product:   { label: 'Продукт',   color: '#FF8A50' },
}

const PHASES = [
  { weeks: [1,2,3,4],    label: 'Фаза 1 — Фундамент',       color: '#AAFF3E' },
  { weeks: [5,6,7,8],    label: 'Фаза 2 — Первые продажи',   color: '#00E5CC' },
  { weeks: [9,10,11,12], label: 'Фаза 3 — Оптимизация',      color: '#FFB800' },
]
const phaseOf = (w: number) => PHASES.find(p => p.weeks.includes(w)) || PHASES[0]

function TaskCard({ task, expanded, onToggle, onStatus }: {
  task: Task; expanded: boolean; onToggle: () => void; onStatus: (s: Status) => void
}) {
  const cat   = CAT[task.category] || { label: task.category, color: '#AAFF3E' }
  const done  = task.status === 'done'
  const inProg = task.status === 'in_progress'
  return (
    <div style={{
      background: done ? 'rgba(170,255,62,0.05)' : 'var(--bg-card)',
      border: `1px solid ${done ? 'rgba(170,255,62,0.2)' : inProg ? 'rgba(0,229,204,0.25)' : 'var(--b2)'}`,
      borderRadius: 'var(--r)', overflow: 'hidden', transition: 'all 0.2s',
    }}>
      <div onClick={onToggle} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 13px', cursor:'pointer' }}>
        {/* Checkbox */}
        <div onClick={e => { e.stopPropagation(); onStatus(done ? 'todo' : 'done') }} style={{
          width:20, height:20, borderRadius:5, flexShrink:0, marginTop:1, cursor:'pointer',
          border: `1.5px solid ${done ? 'var(--lime)' : 'var(--b3)'}`,
          background: done ? 'var(--lime-dim)' : 'transparent',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all 0.15s',
        }}>
          {done && <span style={{ color:'var(--lime)', fontSize:11, fontWeight:800 }}>✓</span>}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'var(--f)', fontSize:13, fontWeight:700, color: done ? 'var(--t3)' : 'var(--t1)', textDecoration: done ? 'line-through' : 'none', lineHeight:1.3, marginBottom:5 }}>
            {task.title}
          </div>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:100, background:`${cat.color}15`, color:cat.color, fontFamily:'var(--f)' }}>
              <CategoryIcon cat={task.category} size={10}/> {cat.label}
            </span>
            {task.priority === 'critical' && <span className="badge badge-rose" style={{ fontSize:9 }}>🔴 Критично</span>}
            {task.source_flag            && <span className="badge badge-amber" style={{ fontSize:9 }}>⚑ Из анализа</span>}
            {task.deadline && <span className="t-small" style={{ fontSize:10 }}>📅 {new Date(task.deadline).toLocaleDateString('ru',{day:'numeric',month:'short'})}</span>}
          </div>
        </div>

        <span style={{ color:'var(--t4)', fontSize:11, flexShrink:0, marginTop:2, transform:expanded?'rotate(180deg)':'none', transition:'transform 0.2s' }}>▾</span>
      </div>

      {expanded && (
        <div style={{ borderTop:'1px solid var(--b1)', padding:'12px 13px', background:'var(--bg-2)', animation:'screenIn 0.2s var(--ease)' }}>
          <p className="t-body" style={{ marginBottom:12 }}>{task.description}</p>
          {(task.resources||[]).length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div className="t-label" style={{ marginBottom:6 }}>🔗 Ресурсы</div>
              {task.resources!.map(url => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                  style={{ display:'block', fontSize:12, color:'var(--lime)', textDecoration:'none', marginBottom:2, fontFamily:'var(--f)' }}>
                  {url}
                </a>
              ))}
            </div>
          )}
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            {(['todo','in_progress','done'] as const).map(s => {
              const labels = { todo:'📋 К выполнению', in_progress:'⚡ В процессе', done:'✅ Готово' }
              return (
                <button key={s} onClick={() => onStatus(s)} style={{
                  fontFamily:'var(--f)', fontSize:11, fontWeight:700, padding:'5px 11px',
                  borderRadius:100, border:'1px solid', cursor:'pointer', transition:'all 0.13s',
                  background: task.status === s ? 'var(--lime-dim)'        : 'var(--bg-card)',
                  color:      task.status === s ? 'var(--lime)'             : 'var(--t3)',
                  borderColor: task.status === s ? 'rgba(170,255,62,0.3)'  : 'var(--b2)',
                }}>{labels[s]}</button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function RoadmapScreen({ ideaId, sessionId, ideaTitle, onBack }: Props) {
  const [status,   setStatus]   = useState<'idle'|'loading'|'done'|'error'>('idle')
  const [tasks,    setTasks]    = useState<Task[]>([])
  const [error,    setError]    = useState('')
  const [view,     setView]     = useState<'timeline'|'board'>('timeline')
  const [filter,   setFilter]   = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const h = { 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('nexus_token')}` }

  async function start() {
    setStatus('loading')
    try {
      await fetch(`/api/roadmap/${sessionId}/${ideaId}`, { method:'POST', headers:h })
      const poll = setInterval(async () => {
        const d = await (await fetch(`/api/roadmap/${sessionId}/${ideaId}`, { headers:h })).json()
        if (d.status==='done')  { clearInterval(poll); setTasks(d.roadmap||[]); setStatus('done') }
        if (d.status==='error') { clearInterval(poll); setError(d.error||'Ошибка'); setStatus('error') }
      }, 3500)
      setTimeout(() => clearInterval(poll), 180_000)
    } catch(e:unknown) { setError((e as Error).message); setStatus('error') }
  }

  async function updateStatus(id: string, s: Status) {
    setTasks(prev => prev.map(t => t.id === id ? {...t, status:s} : t))
    try { await fetch(`/api/roadmap/${sessionId}/${ideaId}/task/${id}`, { method:'PATCH', headers:h, body:JSON.stringify({status:s}) }) } catch {}
  }

  const total = tasks.length
  const done  = tasks.filter(t => t.status === 'done').length
  const pct   = total > 0 ? Math.round((done/total)*100) : 0
  const cats  = ['all', ...Array.from(new Set(tasks.map(t => t.category)))]
  const shown = filter === 'all' ? tasks : tasks.filter(t => t.category === filter)

  const byWeek: Record<number,Task[]> = {}
  for (const t of shown) { if (!byWeek[t.week]) byWeek[t.week]=[]; byWeek[t.week].push(t) }
  const weeks = Object.keys(byWeek).map(Number).sort((a,b)=>a-b)

  return (
    <div className="screen">
      <button className="btn btn-ghost" onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:16 }}>
        <ChevronLeft size={15}/><span>Идея</span>
      </button>
      <div className="t-label" style={{ marginBottom:3, color:'var(--lime)' }}>{ideaTitle}</div>
      <div className="t-title" style={{ marginBottom:4 }}>Роадмап · 90 дней</div>
      <div className="t-small" style={{ marginBottom:20 }}>Персональный план запуска по неделям</div>

      {/* IDLE */}
      {status === 'idle' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:20, justifyContent:'center' }}>
          <div style={{ display:'flex', justifyContent:'center' }}><RoadmapIllustration /></div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[['⚖️','Юридика и регистрация','ИП/ООО, налоги, лицензии'],
              ['💰','Финансовый план','Расходы, резервы, бухгалтерия'],
              ['📣','Запуск продаж','Маркетинг, первые клиенты, каналы'],
              ['⚙️','Операции','Процессы, команда, инфраструктура']].map(([icon,t,d]) => (
              <div key={t} style={{ display:'flex', gap:12, alignItems:'flex-start', background:'var(--bg-card)', border:'1px solid var(--b2)', borderRadius:'var(--r)', padding:'11px 13px' }}>
                <span style={{ fontSize:18 }}>{icon}</span>
                <div>
                  <div style={{ fontFamily:'var(--f)', fontSize:13, fontWeight:700, color:'var(--t1)', marginBottom:2 }}>{t}</div>
                  <div className="t-small">{d}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={start}>🗺️ Построить роадмап</button>
        </div>
      )}

      {/* LOADING */}
      {status === 'loading' && (
        <div className="loader-wrap">
          <div className="loader-ring"/>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'var(--f)', fontSize:15, fontWeight:700, color:'var(--t1)', marginBottom:4 }}>Строим роадмап</div>
            <div className="t-small">Groq генерирует план на 12 недель…</div>
          </div>
          <div style={{ width:'100%', maxWidth:240 }}>
            <div className="progress-track"><div className="progress-fill" style={{ width:'65%' }}/></div>
          </div>
        </div>
      )}

      {/* ERROR */}
      {status === 'error' && (
        <div className="info-block info-block-rose">
          <p style={{ color:'var(--rose)', fontSize:13, marginBottom:12, fontFamily:'var(--f)' }}>{error}</p>
          <button className="btn btn-outline btn-sm" onClick={start} style={{ width:'auto' }}>Повторить</button>
        </div>
      )}

      {/* DONE */}
      {status === 'done' && (
        <>
          {/* Progress card */}
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--b2)', borderRadius:'var(--r-lg)', padding:16, marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div>
                <div style={{ fontFamily:'var(--f)', fontSize:13, fontWeight:700, color:'var(--t1)' }}>Прогресс</div>
                <div className="t-small">{done} из {total} задач</div>
              </div>
              <div style={{ fontFamily:'var(--fm)', fontSize:28, fontWeight:700, color: pct>=80?'var(--lime)':pct>=40?'var(--teal)':'var(--t1)' }}>{pct}%</div>
            </div>
            <div className="progress-track" style={{ marginBottom:12 }}>
              <div className="progress-fill" style={{ width:`${pct}%` }}/>
            </div>
            {/* Phase bars */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {PHASES.map(ph => {
                const pts = tasks.filter(t => ph.weeks.includes(t.week))
                const pd  = pts.filter(t => t.status==='done').length
                return (
                  <div key={ph.label}>
                    <div style={{ width:'100%', height:3, borderRadius:100, background:'var(--b2)', marginBottom:4 }}>
                      <div style={{ height:'100%', borderRadius:100, background:ph.color, width:`${pts.length?(pd/pts.length)*100:0}%`, transition:'width 0.5s', boxShadow:`0 0 8px ${ph.color}60` }}/>
                    </div>
                    <div className="t-small" style={{ fontSize:9, color:ph.color }}>{ph.label.split('—')[1]?.trim()}</div>
                    <div style={{ fontFamily:'var(--fm)', fontSize:10, color:'var(--t3)' }}>{pd}/{pts.length}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* View toggle + filter */}
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            <div style={{ display:'flex', background:'var(--bg-card)', border:'1px solid var(--b2)', borderRadius:'var(--r-sm)', overflow:'hidden' }}>
              {(['timeline','board'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  fontFamily:'var(--f)', fontSize:11, fontWeight:700, padding:'7px 13px',
                  border:'none', cursor:'pointer', transition:'all 0.13s',
                  background: view===v ? 'var(--lime-dim)' : 'transparent',
                  color:      view===v ? 'var(--lime)'     : 'var(--t3)',
                }}>
                  {v==='timeline' ? '📅 Недели' : '📋 Доска'}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {cats.map(cat => {
                const meta = CAT[cat]
                return (
                  <button key={cat} onClick={() => setFilter(cat)} style={{
                    fontFamily:'var(--f)', fontSize:11, fontWeight:700, padding:'6px 11px',
                    borderRadius:100, border:'1px solid', cursor:'pointer', transition:'all 0.13s',
                    background:   filter===cat ? `${meta?.color||'var(--lime)'}18` : 'var(--bg-card)',
                    color:        filter===cat ? (meta?.color||'var(--lime)')       : 'var(--t3)',
                    borderColor:  filter===cat ? `${meta?.color||'var(--lime)'}40` : 'var(--b2)',
                  }}>
                    {cat==='all' ? '🗂 Все' : <><CategoryIcon cat={cat} size={11}/> {meta?.label||cat}</>}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="scroll-area">
            {/* Timeline */}
            {view === 'timeline' && weeks.map(week => {
              const ph   = phaseOf(week)
              const wt   = byWeek[week]
              const wd   = wt.filter(t => t.status==='done').length
              return (
                <div key={week} style={{ display:'flex', gap:0, marginBottom:4 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginRight:12, flexShrink:0 }}>
                    <div style={{ width:30, height:30, borderRadius:8, background: wd===wt.length ? 'var(--lime-dim)' : `${ph.color}18`, border:`1px solid ${ph.color}40`, color:ph.color, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--fm)', fontSize:12, fontWeight:700, flexShrink:0 }}>{week}</div>
                    <div style={{ width:1, flex:1, minHeight:8, background:`${ph.color}20`, marginTop:4 }}/>
                  </div>
                  <div style={{ flex:1, paddingBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                      <div style={{ fontFamily:'var(--f)', fontSize:11, fontWeight:700, color:ph.color }}>Неделя {week}</div>
                      <div className="t-small">{wd}/{wt.length}</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {wt.map(task => (
                        <TaskCard key={task.id} task={task}
                          expanded={expanded===task.id}
                          onToggle={() => setExpanded(expanded===task.id ? null : task.id)}
                          onStatus={s => updateStatus(task.id, s)} />
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Board */}
            {view === 'board' && (
              <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
                {([
                  { key:'todo'        as Status, label:'📋 К выполнению', color:'var(--t3)'   },
                  { key:'in_progress' as Status, label:'⚡ В процессе',   color:'var(--teal)' },
                  { key:'done'        as Status, label:'✅ Выполнено',    color:'var(--lime)'  },
                ]).map(col => {
                  const ct = shown.filter(t => t.status===col.key)
                  return (
                    <div key={col.key}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                        <div style={{ fontFamily:'var(--f)', fontSize:13, fontWeight:700, color:col.color }}>{col.label}</div>
                        <span className="badge badge-neutral">{ct.length}</span>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {ct.length===0 && <div className="t-small" style={{ padding:'10px 0', color:'var(--t4)' }}>Нет задач</div>}
                        {ct.map(task => (
                          <TaskCard key={task.id} task={task}
                            expanded={expanded===task.id}
                            onToggle={() => setExpanded(expanded===task.id ? null : task.id)}
                            onStatus={s => updateStatus(task.id, s)} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div style={{ height:32 }}/>
          </div>
        </>
      )}
    </div>
  )
}
