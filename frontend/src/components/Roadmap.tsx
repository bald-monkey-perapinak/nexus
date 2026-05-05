import { useState, useEffect } from 'react'
import { ChevronLeft, RoadmapIllustration, CategoryIcon } from './Icons'

interface RoadmapProps {
  ideaId: string
  sessionId: string
  ideaTitle: string
  onBack: () => void
}

type TaskStatus = 'todo' | 'in_progress' | 'done'

interface Task {
  id: string
  week: number
  title: string
  description: string
  category: string
  priority: string
  deadline: string
  resources?: string[]
  status: TaskStatus
  source_flag?: string
}

const CAT_META: Record<string, { label: string; color: string; bg: string }> = {
  legal:     { label: 'Юридика',   color: '#4F46E5', bg: '#EEF2FF' },
  finance:   { label: 'Финансы',   color: '#059669', bg: '#ECFDF5' },
  marketing: { label: 'Маркетинг', color: '#D97706', bg: '#FFFBEB' },
  ops:       { label: 'Операции',  color: '#0891B2', bg: '#ECFEFF' },
  hiring:    { label: 'Найм',      color: '#7C3AED', bg: '#F5F3FF' },
  product:   { label: 'Продукт',   color: '#BE185D', bg: '#FDF2F8' },
}

const PRI_COLOR: Record<string, string> = {
  critical: 'var(--rose)', important: 'var(--amber)', optional: 'var(--text-4)'
}

const WEEK_PHASES = [
  { weeks: [1,2,3,4],   label: 'Фаза 1 — Фундамент',       color: '#4F46E5' },
  { weeks: [5,6,7,8],   label: 'Фаза 2 — Первые продажи',   color: '#059669' },
  { weeks: [9,10,11,12],label: 'Фаза 3 — Оптимизация',      color: '#D97706' },
]

function phaseFor(week: number) {
  return WEEK_PHASES.find(p => p.weeks.includes(week)) || WEEK_PHASES[0]
}

export function RoadmapScreen({ ideaId, sessionId, ideaTitle, onBack }: RoadmapProps) {
  const [status,  setStatus]  = useState<'idle'|'loading'|'done'|'error'>('idle')
  const [tasks,   setTasks]   = useState<Task[]>([])
  const [error,   setError]   = useState('')
  const [view,    setView]    = useState<'timeline'|'board'>('timeline')
  const [filter,  setFilter]  = useState<string>('all')
  const [expanded,setExpanded]= useState<string | null>(null)

  const token = localStorage.getItem('nexus_token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  async function start() {
    setStatus('loading')
    try {
      await fetch(`/api/roadmap/${sessionId}/${ideaId}`, { method: 'POST', headers })
      const poll = setInterval(async () => {
        const r = await fetch(`/api/roadmap/${sessionId}/${ideaId}`, { headers })
        const d = await r.json()
        if (d.status === 'done') {
          clearInterval(poll)
          setTasks(d.roadmap || [])
          setStatus('done')
        } else if (d.status === 'error') {
          clearInterval(poll)
          setError(d.error || 'Ошибка')
          setStatus('error')
        }
      }, 3500)
      setTimeout(() => clearInterval(poll), 180_000)
    } catch (e: unknown) {
      setError((e as Error).message)
      setStatus('error')
    }
  }

  async function updateStatus(taskId: string, newStatus: TaskStatus) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    try {
      await fetch(`/api/roadmap/${sessionId}/${ideaId}/task/${taskId}`,
        { method: 'PATCH', headers, body: JSON.stringify({ status: newStatus }) })
    } catch { /* optimistic, silent */ }
  }

  // Stats
  const total = tasks.length
  const done  = tasks.filter(t => t.status === 'done').length
  const inProg= tasks.filter(t => t.status === 'in_progress').length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  // Filter
  const categories = ['all', ...Array.from(new Set(tasks.map(t => t.category)))]
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.category === filter)

  // Group by week
  const byWeek: Record<number, Task[]> = {}
  for (const t of filtered) {
    if (!byWeek[t.week]) byWeek[t.week] = []
    byWeek[t.week].push(t)
  }
  const weeks = Object.keys(byWeek).map(Number).sort((a,b) => a-b)

  return (
    <div className="screen">

      <button className="btn btn-ghost" onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <ChevronLeft size={16}/><span>Идея</span>
      </button>

      <div className="t-label" style={{ marginBottom: 4 }}>{ideaTitle}</div>
      <div className="t-title" style={{ marginBottom: 4 }}>Роадмап · 90 дней</div>
      <div className="t-small" style={{ marginBottom: 20 }}>Персональный план запуска по неделям</div>

      {/* ── IDLE ── */}
      {status === 'idle' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:24, justifyContent:'center' }}>
          <div style={{ display:'flex', justifyContent:'center' }}>
            <RoadmapIllustration />
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              ['⚖️','Юридика и регистрация','ИП/ООО, налоговая система, лицензии'],
              ['💰','Финансовый план','Первые расходы, резервы, бухгалтерия'],
              ['📣','Запуск продаж','Маркетинг, первые клиенты, каналы'],
              ['⚙️','Операции','Процессы, команда, инфраструктура'],
            ].map(([icon,title,desc]) => (
              <div key={title} style={{
                display:'flex', gap:12, alignItems:'flex-start',
                background:'var(--bg-2)', border:'1px solid var(--border)',
                borderRadius:'var(--r)', padding:'12px 14px',
              }}>
                <span style={{ fontSize:20 }}>{icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{title}</div>
                  <div className="t-small">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-primary" onClick={start}>
            🗺️ Построить роадмап
          </button>
        </div>
      )}

      {/* ── LOADING ── */}
      {status === 'loading' && (
        <div className="loader-wrap">
          <div className="loader-spinner"/>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>Строим роадмап</div>
            <div className="t-small">Groq генерирует план на 12 недель…</div>
          </div>
          <div style={{ width:'100%', maxWidth:260 }}>
            <div className="progress-track">
              <div className="progress-fill" style={{ width:'70%', animation:'none' }}/>
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {status === 'error' && (
        <div className="info-block" style={{ borderLeft:'3px solid var(--rose)' }}>
          <p style={{ color:'var(--rose)', fontSize:13, marginBottom:12 }}>{error}</p>
          <button className="btn btn-outline btn-sm" onClick={start} style={{ width:'auto' }}>Повторить</button>
        </div>
      )}

      {/* ── DONE ── */}
      {status === 'done' && (
        <>
          {/* Progress summary */}
          <div style={{
            background:'var(--bg-2)', border:'1px solid var(--border)',
            borderRadius:'var(--r-lg)', padding:'16px', marginBottom:16,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>Прогресс</div>
                <div className="t-small">{done} из {total} задач выполнено</div>
              </div>
              <div style={{
                fontFamily:'var(--f-mono)', fontSize:28, fontWeight:700,
                color: pct >= 80 ? 'var(--emerald)' : pct >= 40 ? 'var(--indigo)' : 'var(--text)',
              }}>{pct}%</div>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width:`${pct}%` }}/>
            </div>

            {/* Phase mini stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:12 }}>
              {WEEK_PHASES.map(ph => {
                const phTasks = tasks.filter(t => ph.weeks.includes(t.week))
                const phDone  = phTasks.filter(t => t.status === 'done').length
                return (
                  <div key={ph.label} style={{ textAlign:'center' }}>
                    <div style={{ width:'100%', height:4, borderRadius:100, background:'var(--border)', marginBottom:4 }}>
                      <div style={{ height:'100%', borderRadius:100, background:ph.color, width:`${phTasks.length ? (phDone/phTasks.length)*100 : 0}%`, transition:'width 0.5s' }}/>
                    </div>
                    <div className="t-small" style={{ fontSize:10 }}>
                      {ph.label.split('—')[1]?.trim()}
                    </div>
                    <div className="t-small" style={{ fontFamily:'var(--f-mono)', fontWeight:600 }}>
                      {phDone}/{phTasks.length}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* View toggle + category filter */}
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            {/* View toggle */}
            <div style={{ display:'flex', border:'1.5px solid var(--border)', borderRadius:'var(--r-sm)', overflow:'hidden' }}>
              {(['timeline','board'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer',
                  border:'none', transition:'all 0.15s',
                  background: view === v ? 'var(--indigo)' : 'var(--bg)',
                  color:      view === v ? '#fff' : 'var(--text-3)',
                }}>
                  {v === 'timeline' ? '📅 Недели' : '📋 Доска'}
                </button>
              ))}
            </div>

            {/* Category filter pills */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {categories.map(cat => {
                const meta = cat !== 'all' ? CAT_META[cat] : null
                return (
                  <button key={cat} onClick={() => setFilter(cat)} style={{
                    padding:'6px 12px', fontSize:11, fontWeight:600,
                    borderRadius:100, border:'1.5px solid',
                    cursor:'pointer', transition:'all 0.13s',
                    background: filter === cat ? (meta?.color || 'var(--indigo)') : 'var(--bg)',
                    color:      filter === cat ? '#fff' : 'var(--text-3)',
                    borderColor: filter === cat ? (meta?.color || 'var(--indigo)') : 'var(--border)',
                  }}>
                    {cat === 'all' ? '🗂 Все' : <><CategoryIcon cat={cat} size={12}/> {meta?.label || cat}</>}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="scroll-area">

            {/* ── TIMELINE VIEW ── */}
            {view === 'timeline' && (
              <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                {weeks.map(week => {
                  const phase = phaseFor(week)
                  const weekTasks = byWeek[week]
                  const weekDone = weekTasks.filter(t => t.status === 'done').length
                  return (
                    <div key={week} style={{ display:'flex', gap:0, marginBottom:4 }}>
                      {/* Timeline spine */}
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginRight:12, flexShrink:0 }}>
                        <div style={{
                          width:32, height:32, borderRadius:8,
                          background: weekDone === weekTasks.length ? 'var(--emerald)' : phase.color,
                          color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:12, fontWeight:700, flexShrink:0,
                          transition:'background 0.3s',
                        }}>{week}</div>
                        <div style={{ width:2, flex:1, minHeight:8, background:`${phase.color}30`, marginTop:4 }}/>
                      </div>

                      {/* Week card */}
                      <div style={{ flex:1, paddingBottom:16 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                          <div style={{ fontSize:12, fontWeight:600, color: phase.color }}>
                            Неделя {week}
                          </div>
                          <div className="t-small">{weekDone}/{weekTasks.length}</div>
                        </div>

                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {weekTasks.map(task => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              expanded={expanded === task.id}
                              onToggle={() => setExpanded(expanded === task.id ? null : task.id)}
                              onStatusChange={(s) => updateStatus(task.id, s)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── BOARD VIEW (by status) ── */}
            {view === 'board' && (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                {([
                  { key:'todo',        label:'📋 К выполнению', color:'var(--text-3)' },
                  { key:'in_progress', label:'⚡ В процессе',   color:'var(--indigo)' },
                  { key:'done',        label:'✅ Выполнено',    color:'var(--emerald)' },
                ] as const).map(col => {
                  const colTasks = filtered.filter(t => t.status === col.key)
                  return (
                    <div key={col.key}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:col.color }}>{col.label}</div>
                        <div className="badge badge-neutral">{colTasks.length}</div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {colTasks.length === 0 && (
                          <div className="t-small" style={{ padding:'12px 0', color:'var(--text-4)' }}>Нет задач</div>
                        )}
                        {colTasks.map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            expanded={expanded === task.id}
                            onToggle={() => setExpanded(expanded === task.id ? null : task.id)}
                            onStatusChange={(s) => updateStatus(task.id, s)}
                          />
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

// ── Task Card ─────────────────────────────────────────────────────────
function TaskCard({ task, expanded, onToggle, onStatusChange }: {
  task: Task
  expanded: boolean
  onToggle: () => void
  onStatusChange: (s: TaskStatus) => void
}) {
  const meta = CAT_META[task.category] || { label: task.category, color: 'var(--text-3)', bg: 'var(--bg-2)' }
  const isDone = task.status === 'done'
  const isIP   = task.status === 'in_progress'

  return (
    <div style={{
      background: isDone ? 'var(--emerald-bg)' : 'var(--bg)',
      border: `1.5px solid ${isDone ? 'rgba(5,150,105,0.2)' : isIP ? 'var(--indigo-mid)' : 'var(--border)'}`,
      borderRadius: 'var(--r)',
      overflow: 'hidden',
      transition: 'all 0.2s',
    }}>
      {/* Header row */}
      <div
        onClick={onToggle}
        style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', cursor:'pointer' }}
      >
        {/* Checkbox */}
        <div
          onClick={e => { e.stopPropagation(); onStatusChange(isDone ? 'todo' : 'done') }}
          style={{
            width:20, height:20, borderRadius:6, flexShrink:0, marginTop:1,
            border: `2px solid ${isDone ? 'var(--emerald)' : 'var(--border-2)'}`,
            background: isDone ? 'var(--emerald)' : 'transparent',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', transition:'all 0.15s',
          }}
        >
          {isDone && <span style={{ color:'#fff', fontSize:11, fontWeight:700 }}>✓</span>}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            fontSize:13, fontWeight:600,
            color: isDone ? 'var(--emerald)' : 'var(--text)',
            textDecoration: isDone ? 'line-through' : 'none',
            lineHeight:1.3, marginBottom:4,
          }}>
            {task.title}
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{
              fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:100,
              background: meta.bg, color: meta.color,
            }}>
              <CategoryIcon cat={task.category} size={10}/> {meta.label}
            </span>
            {task.priority === 'critical' && (
              <span className="badge badge-rose" style={{ fontSize:9 }}>🔴 Критично</span>
            )}
            {task.source_flag && (
              <span className="badge badge-amber" style={{ fontSize:9 }}>⚑ Из анализа</span>
            )}
            {task.deadline && (
              <span className="t-small" style={{ fontSize:10 }}>
                📅 до {new Date(task.deadline).toLocaleDateString('ru', { day:'numeric', month:'short' })}
              </span>
            )}
          </div>
        </div>

        <div style={{
          fontSize:11, color:'var(--text-4)', flexShrink:0, marginTop:2,
          transform: expanded ? 'rotate(180deg)' : 'none', transition:'transform 0.2s',
        }}>▾</div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{
          borderTop:'1px solid var(--border)', padding:'12px 14px',
          background:'var(--bg-2)',
          animation:'fadeUp 0.2s var(--ease)',
        }}>
          <p className="t-body" style={{ marginBottom:12 }}>{task.description}</p>

          {/* Resources */}
          {(task.resources || []).length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div className="t-label" style={{ marginBottom:6 }}>🔗 Ресурсы</div>
              {task.resources!.map(url => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                  style={{ display:'block', fontSize:12, color:'var(--indigo)', textDecoration:'none', marginBottom:2 }}>
                  {url}
                </a>
              ))}
            </div>
          )}

          {/* Status buttons */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {(['todo','in_progress','done'] as const).map(s => {
              const labels = { todo:'📋 К выполнению', in_progress:'⚡ В процессе', done:'✅ Готово' }
              return (
                <button key={s} onClick={() => onStatusChange(s)} style={{
                  padding:'6px 12px', fontSize:11, fontWeight:600,
                  borderRadius:100, border:'1.5px solid',
                  cursor:'pointer', transition:'all 0.13s',
                  background: task.status === s ? 'var(--indigo)' : 'var(--bg)',
                  color:      task.status === s ? '#fff' : 'var(--text-3)',
                  borderColor: task.status === s ? 'var(--indigo)' : 'var(--border)',
                }}>
                  {labels[s]}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
