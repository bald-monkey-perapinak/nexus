import { useState, useEffect } from 'react'
import { authTelegram, authGuest, saveProfile, generateIdeas, setToken, getToken } from './api'
import type { AppScreen, IdeaCard, UserProfile, Contradiction } from './types'

import { AnalyticsScreen }     from './components/Analytics'
import { Splash }               from './components/Splash'
import { Onboarding }           from './components/Onboarding'
import { Generating }           from './components/Generating'
import { IdeasList }            from './components/IdeasList'
import { IdeaDetail }           from './components/IdeaDetail'
import { FinancialModelScreen } from './components/FinancialModel'
import { ValidationScreen }     from './components/Validation'
import { RoadmapScreen }        from './components/Roadmap'

type Screen =
  | AppScreen
  | 'validation'
  | 'roadmap'
  | 'analytics'

/** Определяем, запущено ли приложение внутри Telegram WebApp */
function isTelegramEnv(): boolean {
  return !!(window.Telegram?.WebApp?.initData)
}

export default function App() {
  const [screen, setScreen]               = useState<Screen>('splash')
  const [authLoading, setAuthLoading]     = useState(false)
  const [error, setError]                 = useState('')
  const [sessionId, setSid]               = useState('')
  const [ideas, setIdeas]                 = useState<IdeaCard[]>([])
  const [idea, setIdea]                   = useState<IdeaCard | null>(null)
  const [savedProfile, setProfile]        = useState<UserProfile | null>(null)
  const [contradictions, setContradictions] = useState<Contradiction[]>([])

  // При наличии токена сразу пропускаем сплэш
  useEffect(() => {
    // Telegram: развернуть на весь экран
    window.Telegram?.WebApp?.ready()
    window.Telegram?.WebApp?.expand()

    if (getToken()) {
      setScreen('onboarding')
    }
  }, [])

  // ── Старт: авторизация ─────────────────────────────────────────────

  async function handleStart() {
    setAuthLoading(true)
    setError('')
    try {
      let auth
      if (isTelegramEnv()) {
        // Внутри Telegram Mini App
        const initData = window.Telegram!.WebApp!.initData
        auth = await authTelegram(initData)
      } else {
        // Обычный браузер — гостевой вход
        auth = await authGuest()
      }
      setToken(auth.access_token)
      setScreen('onboarding')
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setAuthLoading(false)
    }
  }

  // ── Профиль ────────────────────────────────────────────────────────

  async function handleProfile(profile: UserProfile) {
    setError('')
    try {
      await saveProfile(profile)
      setProfile(profile)
      const gen = await generateIdeas()
      setSid(gen.session_id)
      setScreen('generating')
    } catch (e: unknown) {
      setError((e as Error).message)
    }
  }

  async function handleRegenerate() {
    if (!savedProfile) { setScreen('onboarding'); return }
    setError('')
    try {
      const gen = await generateIdeas()
      setSid(gen.session_id)
      setScreen('generating')
    } catch (e: unknown) {
      setError((e as Error).message)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <>
      {screen === 'splash' && (
        <Splash onStart={handleStart} loading={authLoading} />
      )}

      {screen === 'onboarding' && (
        <Onboarding onComplete={handleProfile} />
      )}

      {screen === 'generating' && (
        <Generating
          sessionId={sessionId}
          onDone={(list, contradicts) => {
            setIdeas(list)
            setContradictions(contradicts)
            setScreen('ideas')
          }}
          onError={msg => { setError(msg); setScreen('splash') }}
        />
      )}

      {screen === 'ideas' && (
        <IdeasList
          ideas={ideas}
          contradictions={contradictions}
          onSelect={i => { setIdea(i); setScreen('idea_detail') }}
          onRegenerate={handleRegenerate}
          onEditProfile={() => setScreen('onboarding')}
        />
      )}

      {screen === 'idea_detail' && idea && (
        <IdeaDetail
          idea={idea}
          onBack={() => setScreen('ideas')}
          onBuildModel={() => setScreen('financial')}
          onValidate={() => setScreen('validation')}
          onRoadmap={() => setScreen('roadmap')}
          onAnalytics={() => {
          console.log('SWITCHING TO ANALYTICS')
          console.log('IDEA:', idea)
          console.log('SESSION:', sessionId)

  setScreen('analytics')
}}
        />
      )}

      {screen === 'financial' && idea && (
        <FinancialModelScreen
          idea={idea}
          sessionId={sessionId}
          onBack={() => setScreen('idea_detail')}
        />
      )}

      {screen === 'validation' && idea && (
        <ValidationScreen
          ideaId={idea.id}
          sessionId={sessionId}
          ideaTitle={idea.title}
          onBack={() => setScreen('idea_detail')}
        />
      )}

      {screen === 'roadmap' && idea && (
        <RoadmapScreen
          ideaId={idea.id}
          sessionId={sessionId}
          ideaTitle={idea.title}
          onBack={() => setScreen('idea_detail')}
        />
      )}
      {screen === 'analytics' && idea && (
        <AnalyticsScreen
          ideaId={idea.id}
          sessionId={sessionId}
          ideaTitle={idea.title}
          isOnline={idea.is_online || false}
          onBack={() => setScreen('idea_detail')}
        />
      )}

      {error && (
        <div className="toast">
          <span style={{ fontFamily: 'var(--f)' }}>{error}</span>
          <button className="toast-close" onClick={() => setError('')}>×</button>
        </div>
      )}
    </>
  )
}
