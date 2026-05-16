import { useEffect, useState } from 'react'
import { getSessionStatus } from '../api'
import type { IdeaCard, Contradiction } from '../types'
import { GeneratingIllustration } from './Icons'

interface Props {
  sessionId: string
  onDone: (ideas: IdeaCard[], contradictions: Contradiction[]) => void
  onError: (msg: string) => void
}

const STEPS = [
  { label: 'Анализируем профиль',  pct: 8  },
  { label: 'Генерируем 8 идей',    pct: 22 },
  { label: 'Финансовый фильтр',    pct: 40 },
  { label: 'Рыночный анализ',      pct: 57 },
  { label: 'Операционная оценка',  pct: 72 },
  { label: 'Отбираем топ‑6',       pct: 86 },
  { label: 'Обогащаем карточки',   pct: 96 },
]

export function Generating({ sessionId, onDone, onError }: Props) {
  const [idx, setIdx] = useState(0)
  const [pct, setPct] = useState(5)

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const s = await getSessionStatus(sessionId)
        if (s.status === 'done')  { clearInterval(timer); onDone(s.ideas as IdeaCard[], s.contradictions as Contradiction[]) }
        if (s.status === 'error') { clearInterval(timer); onError(s.error || 'Ошибка') }
      } catch { /* silent */ }
      setIdx(i => { const n = Math.min(i + 1, STEPS.length - 1); setPct(STEPS[n].pct); return n })
    }, 3200)
    return () => clearInterval(timer)
  }, [sessionId])

  const step = STEPS[idx]

  return (
    <div className="screen">
      <div className="loader-wrap" style={{ gap: 28 }}>

        <GeneratingIllustration />

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--f)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--t1)', marginBottom: 6 }}>
            <span className="holo-text">NEXUS AI</span>
          </div>
          <div style={{ fontFamily: 'var(--f)', fontSize: 14, fontWeight: 600, color: 'var(--cyan)', transition: 'opacity 0.3s' }}>
            {step.label}…
          </div>
          <div className="t-small" style={{ marginTop: 4 }}>~30–60 секунд</div>
        </div>

        {/* Progress */}
        <div style={{ width: '100%', maxWidth: 260 }}>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <div className="t-label">Обработка</div>
            <div style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--cyan)' }}>{pct}%</div>
          </div>
        </div>

        {/* Step list */}
        <div className="step-list">
          {STEPS.map((s, i) => (
            <div key={s.label} className={`step-item ${i < idx ? 'done' : i === idx ? 'active' : ''}`}>
              <div className="step-dot" />
              <span style={{ fontSize: 12, fontFamily: 'var(--f)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
