import { useEffect, useState } from 'react'
import { getSessionStatus } from '../api'
import type { IdeaCard } from '../types'
import { LoaderGeo } from './Icons'

interface GeneratingProps {
  sessionId: string
  onDone: (ideas: IdeaCard[]) => void
  onError: (msg: string) => void
}

const MESSAGES = [
  'Анализируем профиль...',
  'Генерируем идеи...',
  'Финансовый фильтр...',
  'Рыночный анализ...',
  'Операционная оценка...',
  'Финальный отбор...',
  'Обогащаем карточки...',
]

export function Generating({ sessionId, onDone, onError }: GeneratingProps) {
  const [msgIdx, setMsgIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const status = await getSessionStatus(sessionId)
        if (status.status === 'done') {
          clearInterval(interval)
          onDone(status.ideas as IdeaCard[])
        } else if (status.status === 'error') {
          clearInterval(interval)
          onError(status.error || 'Ошибка генерации')
        }
      } catch {
        // ignore transient errors
      }
      setMsgIdx(i => (i + 1) % MESSAGES.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [sessionId])

  return (
    <div className="screen">
      <div className="loader-wrap">
        <LoaderGeo />
        <div>
          <div className="display-sm" style={{ textAlign: 'center', marginBottom: 8 }}>
            NEXUS
          </div>
          <div className="loader-text">{MESSAGES[msgIdx]}</div>
        </div>

        <div style={{ width: '100%', maxWidth: 200 }}>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${((msgIdx + 1) / MESSAGES.length) * 100}%`,
                transition: 'width 3s linear'
              }}
            />
          </div>
        </div>

        <div className="label" style={{ opacity: 0.4 }}>
          Это займёт ~30–60 сек
        </div>
      </div>
    </div>
  )
}
