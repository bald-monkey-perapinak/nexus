import { useEffect, useState } from 'react'
import { getSessionStatus } from '../api'
import type { IdeaCard } from '../types'
import { NexusLogo } from './Icons'

interface GeneratingProps {
  sessionId: string
  onDone: (ideas: IdeaCard[]) => void
  onError: (msg: string) => void
}

const STEPS = [
  { label: 'Анализируем профиль',       emoji: '🔍', pct: 8  },
  { label: 'Генерируем 8 идей',         emoji: '🧠', pct: 25 },
  { label: 'Финансовый фильтр',         emoji: '💰', pct: 42 },
  { label: 'Рыночный анализ',           emoji: '📊', pct: 58 },
  { label: 'Операционная оценка',       emoji: '⚙️', pct: 72 },
  { label: 'Отбираем топ-6',            emoji: '🏆', pct: 86 },
  { label: 'Обогащаем карточки',        emoji: '✨', pct: 96 },
]

export function Generating({ sessionId, onDone, onError }: GeneratingProps) {
  const [stepIdx, setStepIdx] = useState(0)
  const [pct, setPct] = useState(5)

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const s = await getSessionStatus(sessionId)
        if (s.status === 'done')  { clearInterval(interval); onDone(s.ideas as IdeaCard[]) }
        if (s.status === 'error') { clearInterval(interval); onError(s.error || 'Ошибка') }
      } catch { /* silent */ }
      setStepIdx(i => {
        const next = Math.min(i + 1, STEPS.length - 1)
        setPct(STEPS[next].pct)
        return next
      })
    }, 3200)
    return () => clearInterval(interval)
  }, [sessionId])

  const step = STEPS[stepIdx]

  return (
    <div className="screen">
      <div className="loader-wrap" style={{ gap: 28 }}>

        {/* Animated logo */}
        <div style={{ position: 'relative', width: 80, height: 80 }}>
          {/* Outer spinning ring */}
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ position: 'absolute', inset: 0 }}>
            <circle cx="40" cy="40" r="36" stroke="#E0E7FF" strokeWidth="3" fill="none"/>
            <circle cx="40" cy="40" r="36" stroke="#4F46E5" strokeWidth="3" fill="none"
              strokeDasharray="40 186" strokeLinecap="round"
              style={{ transformOrigin: '40px 40px', animation: 'spin 1.2s linear infinite' }}
            />
          </svg>
          {/* Middle ring */}
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ position: 'absolute', inset: 0 }}>
            <circle cx="40" cy="40" r="26" stroke="#C7D2FE" strokeWidth="2" fill="none"
              strokeDasharray="25 138" strokeLinecap="round"
              style={{ transformOrigin: '40px 40px', animation: 'spin 0.9s linear infinite reverse' }}
            />
          </svg>
          {/* Center logo */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <NexusLogo size={28} />
          </div>
        </div>

        {/* Current step */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8, animation: 'fadeUp 0.3s var(--ease)' }} key={step.emoji}>
            {step.emoji}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }} key={step.label}>
            {step.label}…
          </div>
          <div className="t-small">~30–60 секунд</div>
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', maxWidth: 260 }}>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <div className="t-small">AI-анализ</div>
            <div className="t-small" style={{ fontFamily: 'var(--f-mono)', fontWeight: 600 }}>{pct}%</div>
          </div>
        </div>

        {/* Step list */}
        <div className="step-list">
          {STEPS.map((s, i) => (
            <div key={s.label} className={`step-item ${i < stepIdx ? 'done' : i === stepIdx ? 'active' : ''}`}>
              <div className="step-dot" />
              <span style={{ fontSize: 12 }}>{s.emoji} {s.label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
